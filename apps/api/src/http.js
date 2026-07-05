export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload ?? {});
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...extraHeaders
  });
  res.end(body);
}

export function sendNoContent(res, extraHeaders = {}) {
  res.writeHead(204, extraHeaders);
  res.end();
}

export function sendError(res, error, extraHeaders = {}) {
  const status = error.status || 500;
  if (status >= 500) {
    console.error("Internal Server Error:", error);
  }
  const payload = {
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: status >= 500 ? "Internal server error" : error.message,
      details: status >= 500 ? undefined : error.details
    }
  };
  sendJson(res, status, payload, extraHeaders);
}

export async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new HttpError(400, "INVALID_JSON", "Request body is not valid JSON", {
      parserMessage: error.message
    });
  }
}

export function parsePathname(url) {
  return url.pathname.split("/").filter(Boolean);
}

export function applyCors(req, res, corsOrigin) {
  const requestOrigin = req.headers.origin;
  const allowOrigin = corsOrigin === "*" ? requestOrigin || "*" : corsOrigin;
  const headers = {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "authorization,content-type,x-request-id",
    "access-control-max-age": "86400",
    vary: "origin"
  };

  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  return headers;
}
