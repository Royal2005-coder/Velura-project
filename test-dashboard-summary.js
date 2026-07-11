import { buildDashboardSummary } from "./apps/api/src/dashboard.js";

async function test() {
  try {
    const summary = await buildDashboardSummary(null);
    console.log("=== operations ===");
    console.log(JSON.stringify(summary.operations, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

test();
