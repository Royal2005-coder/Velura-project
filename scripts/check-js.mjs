import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const roots = ["apps/api/src", "packages", "database/seed", "scripts", "src/scripts"];
const ignoredDirectories = new Set(["node_modules", "dist", "coverage", ".git"]);
const files = [];

for (const root of roots) {
  await collectJs(root, files);
}

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    stdio: "inherit"
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Checked ${files.length} JavaScript files.`);

async function collectJs(dir, output) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) continue;
      await collectJs(path, output);
    } else if (/\.(mjs|js)$/.test(entry.name)) {
      output.push(path);
    }
  }
}
