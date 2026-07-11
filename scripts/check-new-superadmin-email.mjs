import fs from "fs";
const SUPABASE_URL = "https://drvkrpoojyncodfytftn.supabase.co";
const env = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const SK = (env.match(/VELURA_SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim()) || process.env.SUPABASE_SERVICE_ROLE_KEY;
const H = { apikey: SK, authorization: `Bearer ${SK}` };

// 1) Find super_admin accounts, most recently created/updated
const users = await fetch(`${SUPABASE_URL}/rest/v1/users?admin_role=eq.super_admin&select=user_id,email,full_name,admin_role,is_active,is_verified,created_at,updated_at&order=updated_at.desc`, { headers: H });
console.log("=== SUPER_ADMIN USERS ===");
console.log(await users.text());

// 2) Recent email_outbox rows (last 20)
const mail = await fetch(`${SUPABASE_URL}/rest/v1/email_outbox?select=email_id,recipient,subject,status,attempts,last_error,created_at,template_code&order=created_at.desc&limit=20`, { headers: H });
console.log("\n=== RECENT EMAIL_OUTBOX ===");
console.log(await mail.text());
