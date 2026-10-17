import { readFileSync, writeFileSync } from "node:fs";
import { run } from "./utils.js";
const filename = new URL("../package.json", import.meta.url);
const pkg = JSON.parse(readFileSync(filename, "utf8"));
const release = process.argv[2];
const parts = pkg.version.split(".").map(Number);
const index = ["major", "minor", "patch"].indexOf(release);
if (index >= 0) {
  parts[index] += 1;
  parts.fill(0, index + 1);
  pkg.version = parts.join(".");
} else if (/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(release ?? "")) pkg.version = release;
else throw new Error("Use: yarn release <major|minor|patch|version>");
writeFileSync(filename, `${JSON.stringify(pkg, null, 2)}\n`);
run("yarn", ["changelog"]);
console.log(`Prepared v${pkg.version}. Review the changes before committing, tagging, and publishing.`);
