import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("URL WebView sessions are not started while their React surface is inactive", async () => {
  const source = await readFile(
    new URL("../src/modules/workspace/connections/webview/WebViewWorkspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /sessionStartedRef\.current \|\| sessionStartingRef\.current \|\| !initialUrl \|\| !isActive/);
});

test("backend bounds updates do not re-show hidden URL WebView sessions", async () => {
  const source = await readFile(new URL("../src-tauri/src/webview.rs", import.meta.url), "utf8");

  assert.match(source, /struct WebviewSession/);
  assert.match(source, /visible: bool/);
  assert.match(source, /if session\.visible\s*\{\s*show_webview/);
  assert.match(source, /session\.visible = false;/);
});
