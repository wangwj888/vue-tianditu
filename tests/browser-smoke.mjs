import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const base = (process.argv[2] || "http://127.0.0.1:5173/vue-tianditu").replace(/\/$/, "");
const output = path.resolve("test-results/browser");
fs.mkdirSync(output, { recursive: true });
const candidates = [
  process.env.BROWSER_EXECUTABLE,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].filter(Boolean);
const executablePath = candidates.find(candidate => fs.existsSync(candidate));
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
const failedRequests = [];
page.on("pageerror", error => errors.push({ message: error.message, stack: error.stack }));
page.on("requestfailed", request => failedRequests.push({ url: request.url(), error: request.failure()?.errorText }));
page.setDefaultTimeout(30000);

async function checkNoDemoError() {
  const text = await page.locator(".demo-error").allTextContents();
  assert.equal(text.join("").trim(), "", "The demo reported an initialization/rendering error");
}
async function alphaPixels() {
  return page.locator(".tdt-heatmap canvas").evaluate(canvas => {
    const context = canvas.getContext("2d");
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let index = 3; index < data.length; index += 4) if (data[index]) count++;
    return count;
  });
}

try {
  await page.goto(base + "/overlay/custom-overlay", { waitUntil: "domcontentloaded" });
  const point = page.locator(".ripple-point");
  await point.waitFor({ state: "visible" });
  await checkNoDemoError();
  await point.click();
  assert.equal((await point.innerText()).trim(), "1", "Slot click must remain reactive after moving into the map");
  const counter = page.getByRole("button", { name: "Vue 子组件计数：0" });
  await counter.click();
  await page.getByRole("button", { name: "Vue 子组件计数：1" }).waitFor();
  const before = await point.boundingBox();
  await page.getByRole("button", { name: "移动位置", exact: true }).click();
  await page.waitForFunction(
    ({ x, y }) => {
      const rect = document.querySelector(".ripple-point").getBoundingClientRect();
      return Math.abs(rect.x - x) + Math.abs(rect.y - y) > 5;
    },
    { x: before.x, y: before.y }
  );
  await page.getByLabel("显示覆盖物", { exact: true }).uncheck();
  await point.waitFor({ state: "hidden" });
  assert.equal(await point.isVisible(), false, "visible=false should hide the custom DOM");
  await page.getByLabel("显示覆盖物", { exact: true }).check();
  await point.waitFor({ state: "visible" });
  assert.equal((await point.innerText()).trim(), "1", "Hiding must preserve slot state");
  await page.getByLabel("可交互", { exact: true }).uncheck();
  await page.waitForFunction(
    () => getComputedStyle(document.querySelector(".tdt-custom-overlay")).pointerEvents === "none"
  );
  const box = await point.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  assert.equal((await point.innerText()).trim(), "1", "interactive=false must pass pointer input through");
  await page.getByLabel("可交互", { exact: true }).check();
  await page.screenshot({ path: path.join(output, "custom-overlay.png"), fullPage: true });
  console.log(
    "Custom overlay: slot/Vue component reactivity, positioning, visibility, and pointer interaction passed."
  );

  await page.goto(base + "/overlay/heatmap", { waitUntil: "domcontentloaded" });
  await page.locator(".tdt-heatmap canvas").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".tdt-heatmap canvas");
    if (!canvas) return false;
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    return pixels.some((value, index) => index % 4 === 3 && value > 0);
  });
  await checkNoDemoError();
  assert.ok((await alphaPixels()) > 0, "Heatmap must draw actual pixels");
  await page.getByRole("button", { name: "清空", exact: true }).click();
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".tdt-heatmap canvas");
    const pixels = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
    return !pixels.some((value, index) => index % 4 === 3 && value > 0);
  });
  assert.equal(await alphaPixels(), 0, "An empty dataset must clear the previous image");
  await page.getByRole("button", { name: "更新数据", exact: true }).click();
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".tdt-heatmap canvas");
    return canvas
      .getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height)
      .data.some((value, index) => index % 4 === 3 && value > 0);
  });
  await page.getByLabel("显示热力图", { exact: true }).uncheck();
  await page.locator(".tdt-heatmap").waitFor({ state: "hidden" });
  assert.equal(await page.locator(".tdt-heatmap").isVisible(), false);
  await page.getByLabel("显示热力图", { exact: true }).check();
  await page.locator(".tdt-heatmap canvas").waitFor({ state: "visible" });
  await page.locator('input[type="range"]').focus();
  await page.keyboard.press("End");
  await page.locator("select").selectOption("cool");
  await page.setViewportSize({ width: 1050, height: 800 });
  await page.waitForFunction(() => {
    const canvas = document.querySelector(".tdt-heatmap canvas");
    const map = document.querySelector(".heatmap-demo-map .tdt-map");
    return canvas && map && Math.abs(canvas.width - map.clientWidth) <= 1;
  });
  await checkNoDemoError();
  assert.ok((await alphaPixels()) > 0);
  await page.screenshot({ path: path.join(output, "heatmap.png"), fullPage: true });
  assert.deepEqual(errors, [], "Browser errors occurred");
  console.log("Heatmap: real canvas drawing, clearing, data/style updates, visibility, and resize passed.");
  console.log("Screenshots: " + output);
} catch (error) {
  await page.screenshot({ path: path.join(output, "failure.png"), fullPage: true }).catch(() => {});
  console.error(error);
  console.error(JSON.stringify({ errors, failedRequests }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
