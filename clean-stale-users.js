import { config } from "./apps/api/src/config.js";
import { deleteRows, selectRows } from "./apps/api/src/supabase.js";

async function run() {
  console.log("=== Cleaning up stale demo users ===");
  const SERVICE_KEY = config.supabaseServiceRoleKey;
  const SUPABASE = config.supabaseUrl;

  const staleUserIds = [
    "a0000000-0000-4000-8000-000000000005", // cskh@velura.vn
    "a0000000-0000-4000-8000-000000000007"  // viewer@velura.vn
  ];

  for (const id of staleUserIds) {
    try {
      console.log(`Deleting stale user ID ${id}...`);
      const resp = await fetch(`${SUPABASE}/rest/v1/users?user_id=eq.${id}`, {
        method: "DELETE",
        headers: {
          apikey: SERVICE_KEY,
          authorization: `Bearer ${SERVICE_KEY}`,
          prefer: "return=representation"
        }
      });
      console.log(`  Status: ${resp.status}`);
    } catch (err) {
      console.error(`  Error deleting ${id}:`, err);
    }
  }

  // Also verify they are gone
  const { rows } = await selectRows("users", { select: "user_id,email" });
  console.log("Remaining users:", rows.map(r => `${r.email} (${r.user_id})`));
}

run().catch(console.error);
