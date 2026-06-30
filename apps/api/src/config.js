export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8787),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  supabaseUrl: stripTrailingSlash(process.env.VELURA_SUPABASE_URL || ""),
  supabaseAnonKey: process.env.VELURA_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.VELURA_SUPABASE_SERVICE_ROLE_KEY || "",
  requestTimeoutMs: Number(process.env.API_REQUEST_TIMEOUT_MS || 15000)
};

export function assertRuntimeConfig() {
  const missing = [];
  if (!config.supabaseUrl) missing.push("VELURA_SUPABASE_URL");
  if (!config.supabaseAnonKey) missing.push("VELURA_SUPABASE_ANON_KEY");
  if (missing.length) {
    throw new Error(`Missing required API environment: ${missing.join(", ")}`);
  }
}

export function getSupabaseServiceKey() {
  return config.supabaseServiceRoleKey || config.supabaseAnonKey;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
