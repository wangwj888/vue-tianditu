import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { run, projectRoot } from "./utils.js";

const artifacts = path.join(projectRoot, ".artifacts");
const pkg = JSON.parse(readFileSync(path.join(projectRoot, "package.json"), "utf8"));
const archive = path.join(artifacts, `${pkg.name}-${pkg.version}.tgz`);

function removeGenerated(directory, parent) {
  if (!existsSync(directory)) return;
  const resolved = realpathSync(directory);
  const relative = path.relative(realpathSync(parent), resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove generated files outside ${parent}: ${resolved}`);
  }
  rmSync(directory, { recursive: true, force: true });
}

run("yarn", ["build"]);
mkdirSync(artifacts, { recursive: true });
const packEnvironment = { ...process.env };
for (const name of Object.keys(packEnvironment)) {
  // Yarn Classic injects legacy npm_config_* values rejected by recent npm versions.
  if (name.toLowerCase().startsWith("npm_config_")) delete packEnvironment[name];
}
run("npm", ["pack", "--silent", "--pack-destination", ".artifacts", "--ignore-scripts"], { env: packEnvironment });
// GNU tar treats "E:/path" as a remote host on Windows unless --force-local is set,
// and MSYS tar needs forward slashes. bsdtar (macOS) does not support the flag,
// so only add it on win32.
const forceLocal = process.platform === "win32" ? ["--force-local"] : [];
const tarPath = value => (process.platform === "win32" ? value.replaceAll("\\", "/") : value);
const listing = spawnSync("tar", [...forceLocal, "-tzf", tarPath(archive)], { encoding: "utf8" });
if (listing.error) throw listing.error;
if (listing.status !== 0) throw new Error(listing.stderr);
const entries = listing.stdout.trim().split(/\r?\n/);
if (
  entries.some(
    entry => entry.split("/").includes("..") || !/^package\/(lib\/|LICENSE$|README\.md$|package\.json$)/.test(entry)
  )
) {
  throw new Error("The npm archive contains unexpected source or development files.");
}
console.log(`Verified npm archive: ${entries.length} publish files.`);

for (const version of [2, 3, "3-min"]) {
  const cwd = path.join(projectRoot, `examples/vue${version}`);
  run("yarn", ["install", "--frozen-lockfile", "--ignore-scripts", "--network-timeout", "60000"], { cwd });

  // Consume exactly the npm archive. Yarn Classic's file:directory dependencies copy
  // the entire source tree, including its development Vue and nested node_modules.
  const modules = path.join(cwd, "node_modules");
  const destination = path.join(modules, pkg.name);
  removeGenerated(destination, modules);
  const staging = mkdtempSync(path.join(artifacts, `vue${version}-`));
  run("tar", [...forceLocal, "-xzf", tarPath(archive), "-C", tarPath(staging)]);
  renameSync(path.join(staging, "package"), destination);
  removeGenerated(staging, artifacts);

  run("yarn", ["typecheck"], { cwd });
  run("yarn", ["build"], { cwd });
}
