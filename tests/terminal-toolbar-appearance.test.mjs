import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [workspaceSource, terminalCss] = await Promise.all([
  readFile(
    new URL("../src/modules/workspace/connections/terminal/TerminalWorkspace.tsx", import.meta.url),
    "utf8",
  ),
  readFile(
    new URL("../src/modules/workspace/connections/terminal/terminal.css", import.meta.url),
    "utf8",
  ),
]);

test("terminal Find toolbar uses compact input typography", () => {
  assert.match(
    terminalCss,
    /\.terminal-search-bar input\s*\{[^}]*font-size:\s*12px;/s,
  );
});

test("terminal color scheme submenu is wider and avoids label wrapping", () => {
  assert.match(
    terminalCss,
    /\.terminal-color-scheme-panel\s*\{[^}]*min-width:\s*220px;/s,
  );
  assert.match(
    terminalCss,
    /\.terminal-color-scheme-panel \.terminal-menu-item\s*\{[^}]*white-space:\s*nowrap;/s,
  );
});

test("terminal color schemes preview on hover and restore when leaving the submenu", () => {
  assert.match(workspaceSource, /onMouseEnter=\{\(\) => previewTerminalColorScheme\(null\)\}/);
  assert.match(workspaceSource, /onMouseEnter=\{\(\) => previewTerminalColorScheme\(scheme\.id\)\}/);
  assert.match(workspaceSource, /onMouseLeave=\{restoreTerminalColorSchemePreview\}/);
  assert.match(
    workspaceSource,
    /committedTerminalColorSchemeRef\.current = appliedScheme;[\s\S]*?saveTerminalColorScheme\(nextScheme\)/,
  );
});
