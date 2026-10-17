import { copyChangelog, run } from "./utils.js";
copyChangelog();
run("yarn", ["vitepress", "build", "docs"]);
