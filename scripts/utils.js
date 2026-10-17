import { spawnSync } from "node:child_process";
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export function run(command, args = [], options = {}) {
  const executable = process.platform === "win32" && /^(?:yarn|npm|npx)$/.test(command) ? `${command}.cmd` : command;
  const result = spawnSync(executable, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: process.platform === "win32" && executable.endsWith(".cmd"),
    ...options
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
export function copyChangelog() {
  copyFileSync(new URL("../CHANGELOG.md", import.meta.url), new URL("../docs/CHANGELOG.md", import.meta.url));
}
