import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ordinary workspace command menus are not RDP-blocking DOM overlays", async () => {
  const source = await readFile(
    new URL("../src/modules/workspace/nativeOverlay.ts", import.meta.url),
    "utf8",
  );

  for (const selector of [
    ".quick-connect-menu",
    ".add-connection-menu",
    ".tree-context-menu",
    ".rail-context-menu",
    ".screenshot-menu",
  ]) {
    assert.equal(
      source.includes(selector),
      false,
      `${selector} should use native menus instead of RDP DOM overlay parking`,
    );
  }
});

test("Dashboard background popover suppresses intersecting WebView2 surfaces", async () => {
  const source = await readFile(
    new URL("../src/modules/workspace/nativeOverlay.ts", import.meta.url),
    "utf8",
  );

  const webviewSelectorMatch = source.match(
    /const WEBVIEW_BLOCKING_OVERLAY_SELECTOR = \[(?<body>[\s\S]*?)\]\.join/,
  );
  assert.ok(webviewSelectorMatch?.groups?.body, "WebView2 blocking overlay selector should be explicit");
  assert.match(webviewSelectorMatch.groups.body, /"\.dw-bg-popover"/);
});
