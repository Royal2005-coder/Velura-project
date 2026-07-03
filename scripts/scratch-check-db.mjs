import { selectRows, selectOne } from "../apps/api/src/supabase.js";

async function check() {
  console.log("Checking Supabase connection and tables...");
  try {
    const products = await selectRows("product", {});
    console.log("Product count:", products.rows.length, "Total:", products.count);
    if (products.rows.length > 0) {
      console.log("First product sample:", products.rows[0]);
    } else {
      console.log("No products returned! This means either table is empty or permission is denied.");
    }
  } catch (err) {
    console.error("Failed to query product table:", err);
  }

  try {
    const users = await selectRows("users", {});
    console.log("Users count:", users.rows.length, "Total:", users.count);
  } catch (err) {
    console.error("Failed to query users table:", err);
  }
}

check();
