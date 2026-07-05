export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8787),
  corsOrigins: parseCsv(process.env.CORS_ORIGIN || "http://localhost:5173"),
  supabaseUrl: stripTrailingSlash(process.env.VELURA_SUPABASE_URL || ""),
  supabaseAnonKey: process.env.VELURA_SUPABASE_ANON_KEY || "",
  supabaseServiceRoleKey: process.env.VELURA_SUPABASE_SERVICE_ROLE_KEY || "",
  requestTimeoutMs: Number(process.env.API_REQUEST_TIMEOUT_MS || 15000),
  maxBodyBytes: Number(process.env.API_MAX_BODY_BYTES || 65536),
  adminMutationLimitPerMinute: Number(process.env.ADMIN_MUTATION_LIMIT_PER_MINUTE || 60),
  accountMaintenanceIntervalMs: Number(process.env.ACCOUNT_MAINTENANCE_INTERVAL_MS || 3600000),
  emailWorkerIntervalMs: Number(process.env.EMAIL_WORKER_INTERVAL_MS || 60000),
  emailWebhookUrl: process.env.EMAIL_WEBHOOK_URL || "",
  emailWebhookToken: process.env.EMAIL_WEBHOOK_TOKEN || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpAppPassword: process.env.SMTP_APP_PASSWORD || "",
  smtpFrom: process.env.SMTP_FROM || "",
  supportAlertTo: process.env.SUPPORT_ALERT_TO || process.env.SMTP_USER || "",
  n8nChatWebhookUrl: process.env.N8N_CHAT_WEBHOOK_URL || "",
  n8nChatWebhookToken: process.env.N8N_CHAT_WEBHOOK_TOKEN || ""
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
  return config.supabaseServiceRoleKey;
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function parseCsv(value) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}
