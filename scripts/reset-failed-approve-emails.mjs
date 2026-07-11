import fs from "fs";
const SUPABASE_URL = "https://drvkrpoojyncodfytftn.supabase.co";
const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const SK = (env.match(/VELURA_SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim()) || process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SK, authorization: `Bearer ${SK}`, "content-type": "application/json", prefer: "return=representation" };

// Reset failed super_admin_approved emails back to pending for retry
const reset = await fetch(
  `${SUPABASE_URL}/rest/v1/email_outbox?status=eq.failed&template_code=eq.super_admin_approved`,
  {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ status: "pending", attempts: 0, last_error: null, next_attempt_at: new Date().toISOString() }),
  }
);
console.log("RESET status:", reset.status);
console.log(await reset.text());
