import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const terminalWorkspaceSource = await readFile(
  new URL("../src/modules/workspace/connections/terminal/TerminalWorkspace.tsx", import.meta.url),
  "utf8",
);

test("terminal focus restore runs when Workspace becomes active again", () => {
  assert.match(
    terminalWorkspaceSource,
    /restoreFocusedTerminalPane\("workspace-activated"\)/,
    "switching back to the Workspace Module should restore text input focus to the focused terminal Pane",
  );
  assert.match(
    terminalWorkspaceSource,
    /requestAnimationFrame\(restore\)/,
    "Workspace activation focus restore should retry after layout has settled",
  );
});
