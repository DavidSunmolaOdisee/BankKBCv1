import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function listJsFiles(dir) {
  const result = [];
  for (const item of readdirSync(dir)) {
    const full = join(dir, item);
    const stat = statSync(full);
    if (stat.isDirectory() && item !== "node_modules") result.push(...listJsFiles(full));
    if (stat.isFile() && item.endsWith(".js")) result.push(full);
  }
  return result;
}

const files = listJsFiles(process.cwd());
let failed = false;
for (const file of files) {
  const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (check.status !== 0) {
    failed = true;
    console.error(check.stderr || check.stdout);
  }
}
if (failed) process.exit(1);
console.log(`Syntax OK for ${files.length} JS files.`);
