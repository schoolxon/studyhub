import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const files = (await readdir(dir))
  .filter((f) => f.startsWith("p") && f.endsWith(".mjs"))
  .sort();

let failed = 0;
for (const file of files) {
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(dir, file)], {
      env: process.env,
      stdio: "inherit",
    });
    child.on("close", resolve);
  });
  if (code !== 0) failed += 1;
}
if (failed) {
  console.error(`\n${failed}/${files.length} audit tests failed`);
  process.exit(1);
}
console.log(`\nAll ${files.length} audit tests passed`);
