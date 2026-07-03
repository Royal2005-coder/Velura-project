import { selectOne, insertRow } from "../apps/api/src/supabase.js";
import { hashPassword } from "../apps/api/src/auth-helper.js";

async function seed() {
  console.log("Seeding test users...");
  try {
    const passwordHash = hashPassword("123456");
    
    // User 1: Phone
    const user1 = await selectOne("users", { phone: "eq.0912345678" });
    if (!user1) {
      const u1 = await insertRow("users", {
        phone: "0912345678",
        password_hash: passwordHash,
        full_name: "Khách hàng Test Phone",
        role: "member",
        is_active: true
      });
      console.log("Created Phone test user:", u1.user_id);
    } else {
      console.log("Phone test user already exists:", user1.user_id);
    }

    // User 2: Email
    const user2 = await selectOne("users", { email: "eq.user@velura.vn" });
    if (!user2) {
      const u2 = await insertRow("users", {
        email: "user@velura.vn",
        password_hash: passwordHash,
        full_name: "Khách hàng Test Email",
        role: "member",
        is_active: true
      });
      console.log("Created Email test user:", u2.user_id);
    } else {
      console.log("Email test user already exists:", user2.user_id);
    }
  } catch (err) {
    console.error("Failed to seed test users:", err);
  }
}

seed();
