import { config } from "./apps/api/src/config.js";

const SECRET_KEY = config.supabaseServiceRoleKey;
const SUPABASE = config.supabaseUrl;

if (!SECRET_KEY || !SUPABASE) {
  console.error("Missing configuration");
  process.exit(1);
}

const authIds = [
  "7ae0e427-1ae4-4b04-a551-595b8a7c519b", // cskh@velura.vn
  "d6bfd0cf-36b9-46e4-822b-381c5acd7745"  // viewer@velura.vn
];

async function run() {
  console.log("=== Deleting broken users from auth.users ===");
  for (const id of authIds) {
    try {
      console.log(`Deleting auth user ID ${id}...`);
      const resp = await fetch(`${SUPABASE}/auth/v1/admin/users/${id}`, {
        method: "DELETE",
        headers: {
          apikey: SECRET_KEY,
          authorization: `Bearer ${SECRET_KEY}`
        }
      });
      const text = await resp.text();
      console.log(`  Status: ${resp.status}, Response: ${text}`);
    } catch (err) {
      console.error(`  Error deleting ${id}:`, err.message);
    }
  }
}

run().catch(console.error);
