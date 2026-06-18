import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vite emits relative asset URLs for packaged Tauri webviews", async () => {
  const source = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");

  assert.match(source, /base:\s*["']\.\/["']/);
});

test("Tauri asset scope allows font files directly under the resource fonts folder", async () => {
  const source = await readFile(new URL("../src-tauri/tauri.conf.json", import.meta.url), "utf8");
  const config = JSON.parse(source);

  assert.ok(
    config.app.security.assetProtocol.scope.includes("$RESOURCE/fonts/**/*"),
    "custom fonts need the resource directory scope so direct-child font files are not rejected with 403",
  );
});
