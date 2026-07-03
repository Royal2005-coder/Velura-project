import { HttpError } from "./http.js";
import { getAuthUser, selectOne } from "./supabase.js";
import { verifyJwt } from "./auth-helper.js";

export const rolePages = {
  super_admin: ["dashboard", "accounts", "products", "orders", "reviews", "returns-cskh", "pricing", "promotions", "logs"],
  product_admin: ["dashboard", "products"],
  order_admin: ["dashboard", "orders"],
  pricing_admin: ["dashboard", "pricing", "promotions"],
  review_admin: ["dashboard", "reviews"],
  service_admin: ["dashboard", "returns-cskh"],
  read_only_admin: ["dashboard", "logs"],
  member: ["welcome"],
  guest: ["welcome"]
};

export const roleModules = {
  super_admin: ["*"],
  product_admin: ["dashboard", "products", "categories", "inventory", "audit_logs"],
  order_admin: ["dashboard", "orders", "payments", "shipments", "audit_logs"],
  pricing_admin: ["dashboard", "pricing", "promotions", "vouchers", "bundles", "budgets", "audit_logs"],
  review_admin: ["dashboard", "reviews", "support_tickets", "audit_logs"],
  service_admin: ["dashboard", "returns", "support_tickets", "orders", "audit_logs"],
  read_only_admin: ["dashboard", "audit_logs"],
  member: [],
  guest: []
};

export async function buildAuthContext(req) {
  const token = getToken(req);
  if (!token) return buildGuestContext();

  // Check if it's our custom user JWT
  const decoded = verifyJwt(token);
  if (decoded && decoded.user_id) {
    const user = await selectOne("users", { user_id: `eq.${decoded.user_id}` });
    if (user && user.is_active) {
      return {
        authUser: { id: user.user_id, email: user.email },
        profile: user,
        roleCode: user.role || "member",
        roleName: user.role === "admin" ? "Admin" : "Member",
        isAdmin: user.role === "admin",
        allowedPages: rolePages[user.role] || rolePages.member
      };
    }
  }

  // Fallback to Supabase Auth (for Admins)
  const authUser = await getAuthUser(token);
  if (!authUser?.id) return buildGuestContext();

  const profile = await selectOne("profiles", {
    select: "*,role:app_roles(code,name,is_admin)",
    auth_user_id: `eq.${authUser.id}`
  });

  if (!profile) {
    return {
      authUser,
      profile: null,
      roleCode: "member",
      roleName: "Member",
      isAdmin: false,
      allowedPages: rolePages.member
    };
  }

  const roleCode = profile.role?.code || "member";
  return {
    authUser,
    profile,
    roleCode,
    roleName: profile.role?.name || "Member",
    isAdmin: Boolean(profile.role?.is_admin),
    allowedPages: rolePages[roleCode] || rolePages.member
  };
}

export function requireAuthenticated(context) {
  if (!context.authUser?.id) {
    throw new HttpError(401, "AUTH_REQUIRED", "Authentication is required");
  }
}

export function requireAdmin(context) {
  requireAuthenticated(context);
  if (!context.isAdmin || context.profile?.status !== "active") {
    throw new HttpError(403, "ADMIN_REQUIRED", "Admin access is required");
  }
}

export function requirePermission(context, moduleName, action = "read") {
  requireAdmin(context);
  const modules = roleModules[context.roleCode] || [];
  const canAccessModule = modules.includes("*") || modules.includes(moduleName);
  const readOnlyBlocked = context.roleCode === "read_only_admin" && action !== "read";

  if (!canAccessModule || readOnlyBlocked) {
    throw new HttpError(403, "RBAC_DENIED", "This admin role cannot perform the requested action", {
      role: context.roleCode,
      module: moduleName,
      action
    });
  }
}

function buildGuestContext() {
  return {
    authUser: null,
    profile: null,
    roleCode: "guest",
    roleName: "Guest",
    isAdmin: false,
    allowedPages: rolePages.guest
  };
}

function getToken(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}
