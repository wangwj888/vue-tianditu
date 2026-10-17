import { mkdirSync, cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { run, projectRoot } from "./utils.js";

run("yarn", ["typecheck"]);
run("yarn", ["vite", "build"]);
run("yarn", ["vue-tsc", "--project", "tsconfig.build.json"]);

// TypeScript does not copy source .d.ts files into its declaration output.
cpSync(path.join(projectRoot, "packages/types"), path.join(projectRoot, "lib/types"), {
  recursive: true,
  filter: source => !source.endsWith(".ts") || source.endsWith(".d.ts")
});
function finishDeclarations(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) finishDeclarations(filename);
    else if (entry.name.endsWith(".d.ts")) {
      const content = readFileSync(filename, "utf8")
        .replace(/(["'])~\/([^"']+)\1/g, (_, quote, target) => {
          let relative = path
            .relative(path.dirname(filename), path.join(projectRoot, "lib", target))
            .replaceAll(path.sep, "/");
          if (!relative.startsWith(".")) relative = `./${relative}`;
          return `${quote}${relative}${quote}`;
        })
        .replace(/(["'])(\.{1,2}\/[^"']+)\1/g, (match, quote, target) => {
          const resolved = path.resolve(path.dirname(filename), target);
          // ESM declarations also work in NodeNext consumers when their imports have explicit extensions.
          if (existsSync(`${resolved}.d.ts`)) return `${quote}${target}.js${quote}`;
          if (existsSync(path.join(resolved, "index.d.ts"))) return `${quote}${target}/index.js${quote}`;
          return match;
        });
      writeFileSync(filename, content);
    }
  }
}
finishDeclarations(path.join(projectRoot, "lib"));
const entry = path.join(projectRoot, "lib/index.d.ts");
writeFileSync(entry, `import "./types/index.js";\n${readFileSync(entry, "utf8")}`);

mkdirSync(path.join(projectRoot, "lib/licenses"), { recursive: true });
cpSync(
  path.join(projectRoot, "packages/overlay/heatmap/vendor/LICENSE"),
  path.join(projectRoot, "lib/licenses/heatmap.js.LICENSE"),
  { recursive: true }
);
