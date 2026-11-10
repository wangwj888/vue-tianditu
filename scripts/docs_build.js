import { copyChangelog, run } from "./utils.js";
run("node", ["scripts/gen-api-docs.mjs"]);
copyChangelog();
run("yarn", ["vitepress", "build", "docs"]);
