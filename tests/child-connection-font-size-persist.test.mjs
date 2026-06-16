import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const typesSource = await readFile(new URL("../src/types.ts", import.meta.url), "utf8");
const childConnectionsSource = await readFile(
  new URL("../src/modules/workspace/connections/childConnections.ts", import.meta.url),
  "utf8",
);
const storeSource = await readFile(new URL("../src/store.ts", import.meta.url), "utf8");
const terminalSource = await readFile(
  new URL("../src/modules/workspace/connections/terminal/TerminalWorkspace.tsx", import.meta.url),
  "utf8",
);

test("Child Connection Tabs persist terminal font size separately from the parent Connection", () => {
  assert.match(
    typesSource,
    /interface WorkspaceChildConnection[\s\S]*fontSize\?: number;/,
    "Child Connection Tab storage should include an optional terminal font size",
  );
  assert.match(
    childConnectionsSource,
    /const fontSize = pane\.fontSize;[\s\S]*const fontSizeChanged = child\.fontSize !== fontSize;[\s\S]*fontSize,/,
    "sync should copy the live child Pane font size into child storage",
  );
  assert.match(
    storeSource,
    /function buildPaneForConnection[\s\S]*fontSize\?: number;[\s\S]*fontSize: options\?\.fontSize,/,
    "terminal Pane creation should accept an optional child font size",
  );
  assert.match(
    storeSource,
    /buildPaneForConnection\(childConnection,[\s\S]*fontSize: child\.fontSize,/,
    "child-layout Pane creation should pass the stored child font size",
  );
  assert.match(
    storeSource,
    /updateOpenTerminalPaneFontSize: \(tabId, paneId, fontSize\) => \{[\s\S]*return \{ \.\.\.pane, fontSize \};/,
    "open child Pane font changes should be stored on that Pane",
  );
  assert.match(
    terminalSource,
    /if \(focusedTerminalPane\?\.childConnectionId\) \{[\s\S]*applyFontSizeToPane\(focusedTerminalPane\.id, clamped\);[\s\S]*updateOpenTerminalPaneFontSize\(tab\.id, focusedTerminalPane\.id, persisted\);[\s\S]*return;/,
    "toolbar font changes on child Panes should update the child Pane instead of global terminal settings",
  );
});
