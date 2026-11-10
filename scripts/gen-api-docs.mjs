import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const outputFile = path.join(projectRoot, "docs/.vitepress/generated/api.json");

const COMPONENTS = [
  ["TdtMap", "packages/map/use/const.ts"],
  ["TdtControl", "packages/control/use/const.ts"],
  ["TdtMousetool", "packages/mousetool/use/const.ts"],
  ["TdtMarker", "packages/overlay/marker/use/const.ts"],
  ["TdtLabel", "packages/overlay/label/use/const.ts"],
  ["TdtPolyline", "packages/overlay/polyline/use/const.ts"],
  ["TdtPolygon", "packages/overlay/polygon/use/const.ts"],
  ["TdtRectangle", "packages/overlay/rectangle/use/const.ts"],
  ["TdtCircle", "packages/overlay/circle/use/const.ts"],
  ["TdtInfowindow", "packages/overlay/infowindow/use/const.ts"],
  ["TdtMarkerClusterer", "packages/overlay/markerClusterer/use/const.ts"],
  ["TdtCloudMarkerCollection", "packages/overlay/cloudMarkerCollection/use/const.ts"],
  ["TdtHeatmap", "packages/overlay/heatmap/index.ts"],
  ["TdtCustomOverlay", "packages/overlay/custom/index.ts"],
  ["TdtImageOverlay", "packages/overlay/imageOverlay/use/const.ts"],
  ["TdtSvgOverlay", "packages/overlay/svgOverlay/index.ts"],
  ["TdtTilelayer", "packages/tilelayer/tilelayer/use/const.ts"],
  ["TdtTilelayerTdt", "packages/tilelayer/tdt/use/const.ts"],
  ["TdtTilelayerWms", "packages/tilelayer/wms/use/const.ts"],
  ["TdtGridlineLayer", "packages/tilelayer/gridlineLayer/use/const.ts"],
  ["TdtLayerGroup", "packages/layerGroup/index.ts"],
  ["TdtLayerSwitcher", "packages/layerSwitcher/index.ts"],
  ["TdtSearch", "packages/service/search/index.ts"],
  ["TdtRoute", "packages/service/route/index.ts"],
  ["TdtGeolocation", "packages/service/geolocation/index.ts"],
  ["TdtBusLineSearch", "packages/service/busLineSearch/index.ts"],
  ["TdtCarTrack", "packages/extra/cartrack/use/const.ts"],
  ["TdtBufferTool", "packages/bufferTool/use/const.ts"],
  ["TdtContextMenu", "packages/contextMenu/index.ts"]
];

const fileCache = new Map();

function parseFile(relativeFile) {
  const absolute = path.resolve(projectRoot, relativeFile);
  if (fileCache.has(absolute)) return fileCache.get(absolute);
  if (!existsSync(absolute)) throw new Error(`API source not found: ${relativeFile}`);
  const text = readFileSync(absolute, "utf8");
  const source = ts.createSourceFile(absolute, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const objects = new Map();
  const imports = new Map();
  source.statements.forEach(statement => {
    if (ts.isImportDeclaration(statement) && statement.importClause) {
      const specifier = statement.moduleSpecifier.text;
      const bindings = statement.importClause.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        bindings.elements.forEach(element => imports.set(element.name.text, specifier));
      }
    }
    if (ts.isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach(declaration => {
        if (ts.isIdentifier(declaration.name) && declaration.initializer) {
          objects.set(declaration.name.text, {
            initializer: declaration.initializer,
            source,
            file: absolute
          });
        }
      });
    }
  });
  const parsed = { text, source, objects, imports, file: absolute };
  fileCache.set(absolute, parsed);
  return parsed;
}

function resolveIdentifier(name, context, seen = new Set()) {
  if (context.objects.has(name)) {
    return { initializer: context.objects.get(name).initializer, context };
  }
  const specifier = context.imports.get(name);
  if (!specifier || !specifier.startsWith(".")) return undefined;
  const base = path.resolve(path.dirname(context.file), specifier);
  const candidates = [base, `${base}.ts`, path.join(base, "index.ts")];
  const target = candidates.find(candidate => existsSync(candidate));
  if (!target || seen.has(target)) return undefined;
  seen.add(target);
  const next = parseFile(path.relative(projectRoot, target));
  const entry = next.objects.get(name);
  return entry ? { initializer: entry.initializer, context: next } : undefined;
}

function commentFor(node, context) {
  const text = context.text.slice(node.getFullStart(), node.getStart());
  const matches = [...text.matchAll(/\/\*\*([\s\S]*?)\*\//g)];
  if (!matches.length) return "";
  return matches
    .at(-1)[1]
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*\*?\s?/, "").trim())
    .filter(Boolean)
    .join(" ");
}

function propertyName(node) {
  if (!node.name) return "";
  if (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) || ts.isNumericLiteral(node.name)) {
    return node.name.text;
  }
  return node.name.getText();
}

function findPropType(node) {
  if (!node) return undefined;
  if (ts.isTypeReferenceNode(node) && node.typeName.getText() === "PropType" && node.typeArguments?.length) {
    return node.typeArguments[0].getText();
  }
  let found;
  node.forEachChild(child => {
    if (!found) found = findPropType(child);
  });
  return found;
}

function builtinType(expression) {
  if (!expression) return undefined;
  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements
      .map(element => builtinType(element))
      .filter(Boolean)
      .join(" | ");
  }
  const text = expression.getText();
  return (
    {
      String: "string",
      Number: "number",
      Boolean: "boolean",
      Object: "object",
      Array: "array",
      Function: "function",
      Date: "Date"
    }[text] ?? text
  );
}

function typeOfProperty(property, context) {
  if (!ts.isPropertyAssignment(property)) return "";
  const initializer = property.initializer;
  const propType = findPropType(initializer);
  if (propType) return propType;
  if (ts.isObjectLiteralExpression(initializer)) {
    const typeProperty = initializer.properties.find(
      item => ts.isPropertyAssignment(item) && propertyName(item) === "type"
    );
    if (typeProperty && ts.isPropertyAssignment(typeProperty)) return builtinType(typeProperty.initializer);
  }
  const text = initializer.getText();
  const match = text.match(/PropType<(.+)>/s);
  return match ? match[1] : "unknown";
}

function defaultText(property) {
  if (!ts.isPropertyAssignment(property)) return "—";
  const initializer = property.initializer;
  if (!ts.isObjectLiteralExpression(initializer)) return "—";
  const required = initializer.properties.find(
    item => ts.isPropertyAssignment(item) && propertyName(item) === "required"
  );
  if (required && ts.isPropertyAssignment(required) && required.initializer.getText().startsWith("true")) return "必填";
  const defaultProperty = initializer.properties.find(
    item => ts.isPropertyAssignment(item) && propertyName(item) === "default"
  );
  if (!defaultProperty || !ts.isPropertyAssignment(defaultProperty)) return "—";
  return valueText(defaultProperty.initializer);
}

function valueText(node) {
  if (!node) return "—";
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text ? `\`${node.text}\`` : '`""`';
  if (ts.isNumericLiteral(node)) return node.text;
  if (node.kind === ts.SyntaxKind.TrueKeyword) return "`true`";
  if (node.kind === ts.SyntaxKind.FalseKeyword) return "`false`";
  if (node.kind === ts.SyntaxKind.NullKeyword) return "`null`";
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return valueText(node.body);
  if (ts.isParenthesizedExpression(node)) return valueText(node.expression);
  if (ts.isArrayLiteralExpression(node)) {
    return `\`[${node.elements.map(element => valueText(element).replaceAll("`", "")).join(", ")}]\``;
  }
  if (ts.isObjectLiteralExpression(node)) {
    if (node.properties.some(ts.isSpreadAssignment)) {
      return `\`${node.getText().replace(/\s+/g, " ")}\``;
    }
    const entries = node.properties
      .filter(ts.isPropertyAssignment)
      .slice(0, 4)
      .map(item => `${propertyName(item)}: ${valueText(item.initializer).replaceAll("`", "")}`);
    return `\`{ ${entries.join(", ")}${node.properties.length > 4 ? ", …" : ""} }\``;
  }
  if (ts.isIdentifier(node) && node.text === "undefined") return "—";
  return `\`${node.getText().replace(/\s+/g, " ")}\``;
}

function collectProps(objectNode, context, result) {
  if (!objectNode || !ts.isObjectLiteralExpression(objectNode)) return result;
  objectNode.properties.forEach(property => {
    if (ts.isSpreadAssignment(property)) {
      const target = resolveIdentifier(property.expression.getText(), context);
      if (target) collectProps(target.initializer, target.context, result);
      return;
    }
    if (!ts.isPropertyAssignment(property)) return;
    const name = propertyName(property);
    if (!name) return;
    const entry = {
      name,
      type: typeOfProperty(property, context),
      default: defaultText(property),
      description: commentFor(property, context)
    };
    const index = result.findIndex(item => item.name === name);
    if (index >= 0) result[index] = entry;
    else result.push(entry);
  });
  return result;
}

function collectEvents(objectNode, context, result) {
  if (!objectNode || !ts.isObjectLiteralExpression(objectNode)) return result;
  objectNode.properties.forEach(property => {
    if (ts.isSpreadAssignment(property)) {
      const target = resolveIdentifier(property.expression.getText(), context);
      if (target) collectEvents(target.initializer, target.context, result);
      return;
    }
    if (!ts.isPropertyAssignment(property)) return;
    const name = propertyName(property);
    if (!name) return;
    let params = "—";
    if (ts.isArrowFunction(property.initializer) || ts.isFunctionExpression(property.initializer)) {
      params =
        property.initializer.parameters
          .map(parameter => parameter.type?.getText() ?? parameter.name?.getText() ?? "")
          .filter(Boolean)
          .join(", ") || "—";
    }
    const entry = { name, params, description: commentFor(property, context) };
    const index = result.findIndex(item => item.name === name);
    if (index >= 0) result[index] = entry;
    else result.push(entry);
  });
  return result;
}

const api = {};
for (const [component, relativeFile] of COMPONENTS) {
  const context = parseFile(relativeFile);
  const props = context.objects.get("PROPS");
  const events = context.objects.get("EVENTS");
  api[component] = {
    source: relativeFile,
    props: props ? collectProps(props.initializer, context, []) : [],
    events: events ? collectEvents(events.initializer, context, []) : []
  };
}

mkdirSync(path.dirname(outputFile), { recursive: true });
const output = `${JSON.stringify(api, null, 2)}\n`;
if (process.argv.includes("--check")) {
  const existing = existsSync(outputFile) ? readFileSync(outputFile, "utf8") : "";
  if (existing !== output) {
    console.error(
      `API tables are out of date. Run "yarn docs:api" and commit ${path.relative(projectRoot, outputFile)}.`
    );
    process.exitCode = 1;
  } else {
    console.log(`API tables are up to date (${Object.keys(api).length} components).`);
  }
} else {
  writeFileSync(outputFile, output);
  console.log(
    `Generated API tables for ${Object.keys(api).length} components -> ${path.relative(projectRoot, outputFile)}`
  );
}
