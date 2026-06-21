import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = {
  tokens: new URL("../src/styles/colorSchemes.css", import.meta.url),
  base: new URL("../src/styles/base.css", import.meta.url),
  dialogs: new URL("../src/app/ui/dialog/dialogs.css", import.meta.url),
  dashboard: new URL("../src/modules/dashboard/dashboard.css", import.meta.url),
  installer: new URL("../src/modules/installer/installer.css", import.meta.url),
  itops: new URL("../src/modules/itops/itops.css", import.meta.url),
  settings: new URL("../src/modules/settings/settings.css", import.meta.url),
  connections: new URL(
    "../src/modules/workspace/connections/connections.css",
    import.meta.url,
  ),
  fileViewer: new URL(
    "../src/modules/workspace/connections/file-viewer/file-viewer.css",
    import.meta.url,
  ),
};

test("raised form controls share the adaptive control shadow token", async () => {
  const css = Object.fromEntries(
    await Promise.all(
      Object.entries(files).map(async ([name, url]) => [name, await readFile(url, "utf8")]),
    ),
  );

  assert.match(css.tokens, /--button-shadow-color:\s*var\(--text\);/);
  assert.match(css.tokens, /--control-shadow:\s*[\s\S]*?var\(--control-shadow-color\)/);
  assert.match(css.tokens, /--button-shadow:\s*var\(--control-shadow\);/);

  for (const [name, selector] of [
    ["base", ".primary-button"],
    ["dialogs", ".kk-btn.primary"],
    ["dashboard", ".btn-primary"],
    ["installer", ".installer-button.primary"],
    ["itops", ".itops-page .it-btn.primary"],
    ["fileViewer", ".fv-btn.primary"],
  ]) {
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(
      css[name],
      new RegExp(`${escapedSelector}\\s*\\{[\\s\\S]*?--button-shadow-color:\\s*var\\(--accent\\);`),
      `${selector} must tint the shared shadow from the accent color`,
    );
  }

  assert.match(css.base, /\.approve-button\s*\{[\s\S]*?--button-shadow-color:\s*var\(--green\);/);
  assert.match(css.base, /\.secondary-button\.danger\s*\{[\s\S]*?--button-shadow-color:\s*var\(--red\);/);
  assert.match(
    css.connections,
    /\.quick-connect\s*\{[\s\S]*?--button-shadow-color:\s*var\(--accent\);[\s\S]*?box-shadow:\s*var\(--button-shadow\);/,
  );
  assert.match(
    css.connections,
    /\[data-color-scheme="blue-green-white"\] \.quick-connect\s*\{[\s\S]*?--button-shadow-color:\s*var\(--green\);/,
  );
  assert.match(css.dialogs, /\.kk-btn\.ghost\s*\{[\s\S]*?box-shadow:\s*none;/);
  assert.match(css.itops, /\.itops-page \.it-btn\.ghost\s*\{[\s\S]*?box-shadow:\s*none;/);
  assert.match(css.base, /--control-shadow-color:\s*var\(--border-strong\);[\s\S]*?box-shadow:\s*var\(--control-shadow\);/);
  assert.match(css.dialogs, /\.kk-inp\s*\{[\s\S]*?box-shadow:\s*var\(--control-shadow\);/);
  assert.match(css.dialogs, /\.kk-sel select\s*\{[\s\S]*?box-shadow:\s*var\(--control-shadow\);/);
  assert.match(css.settings, /\.theme-grid\s*\{[\s\S]*?padding:\s*7px;/);
});
