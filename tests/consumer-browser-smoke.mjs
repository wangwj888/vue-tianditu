import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";

if (!process.env.VITE_TDT_KEY)
  throw new Error("Set VITE_TDT_KEY to a Tianditu browser key before running consumer checks.");
const candidates = [
  process.env.BROWSER_EXECUTABLE,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
].filter(Boolean);
const executablePath = candidates.find(candidate => fs.existsSync(candidate));
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const output = path.resolve("test-results/browser");
fs.mkdirSync(output, { recursive: true });

try {
  for (const version of ["vue2", "vue3-min", "vue3"]) {
    const root = path.resolve("examples", version);
    const server = await createServer({
      root,
      configFile: path.join(root, "vite.config.ts"),
      server: { host: "127.0.0.1", port: 5184, strictPort: true }
    });
    const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
    const errors = [];
    const warnings = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => {
      if (message.type() === "warning" && message.text().includes("[Vue warn]")) warnings.push(message.text());
    });
    try {
      await server.listen();
      await page.goto("http://127.0.0.1:5184", { waitUntil: "domcontentloaded" });
      const ripple = page.getByRole("button", { name: "移动", exact: true });
      await ripple.waitFor({ state: "visible", timeout: 30000 });
      await page.waitForFunction(
        () => {
          const canvas = document.querySelector(".tdt-heatmap canvas");
          return (
            canvas &&
            canvas
              .getContext("2d")
              .getImageData(0, 0, canvas.width, canvas.height)
              .data.some((value, index) => index % 4 === 3 && value > 0)
          );
        },
        { timeout: 30000 }
      );
      await ripple.click();
      await page.getByRole("button", { name: "刷新覆盖物", exact: true }).click();
      await page.getByRole("button", { name: "切换覆盖物", exact: true }).click();
      await ripple.waitFor({ state: "hidden" });
      assert.equal(await ripple.isVisible(), false);
      await page.locator(".tdt-heatmap").waitFor({ state: "hidden" });
      assert.equal(await page.locator(".tdt-heatmap").isVisible(), false);
      await page.getByRole("button", { name: "切换覆盖物", exact: true }).click();
      await ripple.waitFor({ state: "visible" });
      await page.locator(".tdt-heatmap canvas").waitFor({ state: "visible" });
      assert.deepEqual(errors, [], version + " had browser errors");
      assert.deepEqual(warnings, [], version + " had Vue warnings");
      await page.screenshot({ path: path.join(output, version + ".png"), fullPage: true });
      console.log(version + ": runtime, slots, canvas pixels, exposed refresh, and visibility passed.");
    } catch (error) {
      await page.screenshot({ path: path.join(output, version + "-failure.png"), fullPage: true }).catch(() => {});
      console.error(JSON.stringify({ version, errors, warnings }, null, 2));
      throw error;
    } finally {
      await page.close();
      await server.close();
    }
  }
} finally {
  await browser.close();
}
