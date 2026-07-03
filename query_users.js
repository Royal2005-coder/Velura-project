import { selectRows } from "./apps/api/src/supabase.js";

async function run() {
  try {
    const { rows: users } = await selectRows("users");
    console.log("Users in DB:");
    users.forEach(u => {
      console.log(`Phone: ${u.phone}, FullName: ${u.full_name}, role: ${u.role}, is_active: ${u.is_active}`);
    });
  } catch (err) {
    console.error(err);
  }
}
run();
