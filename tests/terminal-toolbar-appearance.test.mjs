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

test("terminal color scheme rows use each palette's background and foreground", () => {
  assert.match(
    workspaceSource,
    /backgroundColor: globalTerminalColorScheme\.palette\.background,[\s\S]*?color: globalTerminalColorScheme\.palette\.foreground/,
  );
  assert.match(
    workspaceSource,
    /backgroundColor: scheme\.palette\.background,[\s\S]*?color: scheme\.palette\.foreground/,
  );
  assert.match(
    terminalCss,
    /\.terminal-color-scheme-item:hover:not\(:disabled\)[\s\S]*?box-shadow:\s*inset 0 0 0 2px currentColor;/,
  );
  assert.doesNotMatch(workspaceSource, /terminal-color-scheme-swatch/);
});

test("terminal prompt navigation menu items show their keyboard shortcuts", () => {
  assert.match(
    workspaceSource,
    /terminal\.previousPromptShortcut[\s\S]*?terminal\.nextPromptShortcut/,
  );
  assert.match(
    terminalCss,
    /\.terminal-menu-shortcut\s*\{[^}]*margin-left:\s*auto;[^}]*white-space:\s*nowrap;/s,
  );
});

test("tmux panes hide prompt navigation and Quick Select sits before Copy Selection", () => {
  assert.match(
    workspaceSource,
    /\{!pane\.tmuxSessionId \? \([\s\S]*?terminal\.previousPrompt[\s\S]*?terminal\.nextPrompt[\s\S]*?\) : null\}/,
  );
  assert.match(
    workspaceSource,
    /aria-label=\{t\("terminal\.quickSelect"\)\}[\s\S]*?<Scan size=\{13\} \/>[\s\S]*?aria-label=\{t\("terminal\.copySelection"\)\}/,
  );
  assert.doesNotMatch(
    workspaceSource,
    /setActionsMenuOpen\(false\);\s*startQuickSelect\(\);/,
  );
});
