import { selectOne, updateRows } from "../apps/api/src/supabase.js";

async function check() {
  try {
    const user = await selectOne("users", { phone: "eq.0855808330" });
    if (!user) {
      console.log("User not found!");
      return;
    }
    console.log("Before unlock:", user);
    await updateRows("users", { user_id: `eq.${user.user_id}` }, {
      login_fail_count: 0,
      locked_until: null
    });
    const updatedUser = await selectOne("users", { phone: "eq.0855808330" });
    console.log("After unlock:", updatedUser);
  } catch (err) {
    console.error("Failed:", err);
  }
}

check();
