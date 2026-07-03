import { config, getSupabaseServiceKey } from "./config.js";
import { HttpError } from "./http.js";

export async function supabaseRequest(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);
  const url = new URL(path, config.supabaseUrl);

  Object.entries(options.query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    url.searchParams.set(key, String(value));
  });

  const key = options.useAnonKey ? config.supabaseAnonKey : getSupabaseServiceKey();
  const headers = {
    apikey: key,
    authorization: `Bearer ${options.accessToken || key}`,
    accept: "application/json",
    ...options.headers
  };

  let body;
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  console.log(`[SUPABASE REQ] ${options.method || "GET"} ${url.pathname}${url.search}`);
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body,
      signal: controller.signal
    });

    console.log(`[SUPABASE RES] ${response.status} for ${url.pathname}${url.search}`);
    const text = await response.text();
    const data = text ? parseJson(text) : null;

    if (!response.ok) {
      throw new HttpError(response.status, "SUPABASE_ERROR", "Supabase request failed", data);
    }

    return {
      data,
      count: parseCount(response.headers.get("content-range")),
      status: response.status
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new HttpError(504, "SUPABASE_TIMEOUT", "Supabase request timed out");
    }
    if (error instanceof HttpError) throw error;
    throw new HttpError(502, "SUPABASE_NETWORK_ERROR", "Cannot reach Supabase", {
      message: error.message
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAuthUser(accessToken) {
  if (!accessToken) return null;
  const result = await supabaseRequest("/auth/v1/user", {
    useAnonKey: true,
    accessToken
  });
  return result.data;
}

export async function selectRows(table, query = {}) {
  const result = await supabaseRequest(`/rest/v1/${table}`, {
    query,
    headers: {
      prefer: "count=exact"
    }
  });
  return {
    rows: Array.isArray(result.data) ? result.data : [],
    count: result.count
  };
}

export async function selectOne(table, query = {}) {
  const { rows } = await selectRows(table, { limit: 1, ...query });
  return rows[0] || null;
}

export async function insertRow(table, payload) {
  const result = await supabaseRequest(`/rest/v1/${table}`, {
    method: "POST",
    body: payload,
    headers: {
      prefer: "return=representation"
    }
  });
  return Array.isArray(result.data) ? result.data[0] : result.data;
}

export async function updateRows(table, query, payload) {
  const result = await supabaseRequest(`/rest/v1/${table}`, {
    method: "PATCH",
    query,
    body: payload,
    headers: {
      prefer: "return=representation"
    }
  });
  return Array.isArray(result.data) ? result.data : [];
}

export async function deleteRows(table, query) {
  await supabaseRequest(`/rest/v1/${table}`, {
    method: "DELETE",
    query,
    headers: {
      prefer: "return=minimal"
    }
  });
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseCount(contentRange) {
  if (!contentRange) return undefined;
  const total = contentRange.split("/")[1];
  return total && total !== "*" ? Number(total) : undefined;
}
