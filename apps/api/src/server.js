import { createServer } from "node:http";
import { config, assertRuntimeConfig } from "./config.js";
import { applyCors, HttpError, parsePathname, readJson, sendError, sendJson, sendNoContent } from "./http.js";
import { buildAuthContext, requireAdmin, requirePermission } from "./rbac.js";
import { buildDashboardSummary } from "./dashboard.js";
import { getResource, buildListQuery } from "./resources.js";
import { deleteRows, insertRow, selectRows, updateRows } from "./supabase.js";
import { writeAuditLog } from "./audit.js";
import { handleAction } from "./actions.js";

assertRuntimeConfig();

const server = createServer(async (req, res) => {
  const corsHeaders = applyCors(req, res, config.corsOrigin);

  try {
    if (req.method === "OPTIONS") return sendNoContent(res, corsHeaders);

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const parts = parsePathname(url);

    if (req.method === "GET" && parts[0] === "health") {
      return sendJson(res, 200, {
        ok: true,
        service: "velura-api",
        env: config.nodeEnv,
        time: new Date().toISOString()
      }, corsHeaders);
    }

    if (parts[0] !== "api") {
      throw new HttpError(404, "NOT_FOUND", "Route not found");
    }

    const context = await buildAuthContext(req);

    if (req.method === "GET" && parts[1] === "auth" && parts[2] === "me") {
      return sendJson(res, 200, {
        user: context.authUser,
        profile: context.profile,
        role: context.roleCode,
        roleName: context.roleName,
        isAdmin: context.isAdmin,
        allowedPages: context.allowedPages
      }, corsHeaders);
    }

    if (parts[1] !== "admin") {
      throw new HttpError(404, "NOT_FOUND", "Route not found");
    }

    requireAdmin(context);

    if (req.method === "GET" && parts[2] === "dashboard") {
      requirePermission(context, "dashboard", "read");
      return sendJson(res, 200, await buildDashboardSummary(), corsHeaders);
    }

    const resourceName = parts[2];
    const resource = getResource(resourceName);
    if (!resource) throw new HttpError(404, "RESOURCE_NOT_FOUND", "Admin resource not found");

    if (parts.length === 3 && req.method === "GET") {
      requirePermission(context, resource.module, "read");
      const result = await selectRows(resource.table, buildListQuery(resource, url));
      return sendJson(res, 200, result, corsHeaders);
    }

    if (parts.length === 3 && req.method === "POST") {
      if (resource.readOnly) throw new HttpError(405, "READ_ONLY_RESOURCE", "Resource is read-only");
      requirePermission(context, resource.module, "create");
      const payload = await readJson(req);
      const row = await insertRow(resource.table, payload);
      await writeAuditLog(context, {
        module: resource.module,
        action: "create",
        targetTable: resource.table,
        targetId: row?.id,
        targetCode: row?.code || row?.sku || row?.order_code || row?.email || row?.id,
        afterData: row,
        summary: `Created ${resourceName}`
      });
      return sendJson(res, 201, row, corsHeaders);
    }

    const id = parts[3];
    if (!id) throw new HttpError(404, "NOT_FOUND", "Route not found");

    if (parts.length === 4 && req.method === "PATCH") {
      if (resource.readOnly) throw new HttpError(405, "READ_ONLY_RESOURCE", "Resource is read-only");
      requirePermission(context, resource.module, "update");
      const payload = await readJson(req);
      if (payload.expectedVersion === undefined || payload.expectedVersion === null) {
        throw new HttpError(400, "EXPECTED_VERSION_REQUIRED", "expectedVersion is required for updates");
      }
      const query = { id: `eq.${id}` };
      query.version = `eq.${payload.expectedVersion}`;
      const { expectedVersion, ...patch } = payload;
      const rows = await updateRows(resource.table, query, {
        ...patch,
        version: Number(expectedVersion || 0) + 1,
        updated_at: new Date().toISOString()
      });
      if (!rows.length) throw new HttpError(409, "VERSION_CONFLICT", "Data changed before this update was saved");
      await writeAuditLog(context, {
        module: resource.module,
        action: "update",
        targetTable: resource.table,
        targetId: id,
        afterData: rows[0],
        summary: `Updated ${resourceName} ${id}`
      });
      return sendJson(res, 200, rows[0], corsHeaders);
    }

    if (parts.length === 4 && req.method === "DELETE") {
      if (resource.readOnly) throw new HttpError(405, "READ_ONLY_RESOURCE", "Resource is read-only");
      requirePermission(context, resource.module, "delete");
      await deleteRows(resource.table, { id: `eq.${id}` });
      await writeAuditLog(context, {
        module: resource.module,
        action: "delete",
        targetTable: resource.table,
        targetId: id,
        severity: "attention",
        summary: `Deleted ${resourceName} ${id}`
      });
      return sendNoContent(res, corsHeaders);
    }

    if (parts.length === 5 && parts[4] === "actions" && req.method === "POST") {
      const body = await readJson(req);
      const action = body.action;
      if (!action) throw new HttpError(400, "ACTION_REQUIRED", "action is required");
      requirePermission(context, resource.module, "update");
      const result = await handleAction(context, resourceName, id, action, body);
      return sendJson(res, 200, result, corsHeaders);
    }

    throw new HttpError(404, "NOT_FOUND", "Route not found");
  } catch (error) {
    sendError(res, error, corsHeaders);
  }
});

server.listen(config.port, () => {
  console.log(`Velura API listening on http://localhost:${config.port}`);
});
