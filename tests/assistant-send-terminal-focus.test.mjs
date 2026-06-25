import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const assistantPanelSource = await readFile(
  new URL("../src/ai/AssistantPanel.tsx", import.meta.url),
  "utf8",
);
const paneRegistrySource = await readFile(
  new URL("../src/modules/workspace/paneRegistry.ts", import.meta.url),
  "utf8",
);

test("assistant Send to terminal restores focus to the target terminal pane", () => {
  assert.match(
    paneRegistrySource,
    /export function focusPaneRenderer\(paneId: string\)[\s\S]*?renderer\.focus\(\);/,
    "the pane registry should expose a focused terminal renderer restore helper",
  );
  assert.match(
    assistantPanelSource,
    /writeInputToPane\(activeTerminalPaneId, data\);\s*focusPaneRenderer\(activeTerminalPaneId\);/,
    "sending assistant code to a terminal should return text focus to that terminal pane",
  );
});
