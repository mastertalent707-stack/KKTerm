import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("workspace pane close buttons render only when a tab has multiple panes", async () => {
  const source = await readFile(
    new URL("../src/terminal/TerminalWorkspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /canClosePane=\{panes\.length > 1\}/);
  assert.match(source, /canClosePane \? \(\s*<button[\s\S]*?terminal-pane-close[\s\S]*?\)\s*: null/);
  assert.match(source, /canClosePane \? \(\s*<button[\s\S]*?embedded-pane-close[\s\S]*?\)\s*: null/);
  assert.match(source, /<WebViewWorkspace isActive=\{isActive\} layoutTabId=\{tabId\} tab=\{embeddedTab\} \/>/);
});

test("stored Connection layouts include URL panes and URL Connections hydrate them on open", async () => {
  const layoutSource = await readFile(
    new URL("../src/workspace/layout.ts", import.meta.url),
    "utf8",
  );
  const storeSource = await readFile(
    new URL("../src/store.ts", import.meta.url),
    "utf8",
  );

  assert.match(layoutSource, /serializeLayout\(\s*layout: LayoutNode,\s*panes: WorkspacePane\[\]/);
  assert.match(layoutSource, /pane\.kind === "webview"/);
  assert.match(storeSource, /const stored = loadStoredLayout\(connection\.id\);[\s\S]*?buildPanesFromStoredLayout\(connection, stored\)/);
  assert.match(storeSource, /stored \? hydrateLayout\(stored\.layout, paneIds\) : undefined/);
  assert.match(storeSource, /buildPaneFromStoredLayoutPane/);
});
