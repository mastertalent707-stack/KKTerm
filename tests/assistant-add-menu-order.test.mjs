import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Assistant add menu lists terminal buffer first when available", async () => {
  const source = await readFile(new URL("../src/ai/AssistantPanel.tsx", import.meta.url), "utf8");
  const menu = source.match(/<div className="assistant-add-menu"[\s\S]*?<\/div>\s*\)\s*: null\}/)?.[0] ?? "";

  assert.ok(menu, "Assistant add menu should be discoverable");

  const terminalBufferIndex = menu.indexOf('t("ai.addTerminalBuffer")');
  const addFilesIndex = menu.indexOf('t("ai.addFiles")');
  const addScreenshotIndex = menu.indexOf('t("ai.addScreenshot")');
  const createWidgetIndex = menu.indexOf('t("ai.createWidget")');
  const watchdogIndex = menu.indexOf('t("ai.watchdog")');

  assert.notEqual(terminalBufferIndex, -1, "terminal buffer menu item should exist");
  for (const [label, index] of [
    ["Add Files", addFilesIndex],
    ["Add Screenshot", addScreenshotIndex],
    ["Create Widget", createWidgetIndex],
    ["Watchdog", watchdogIndex],
  ]) {
    assert.notEqual(index, -1, `${label} menu item should exist`);
    assert.ok(
      terminalBufferIndex < index,
      "terminal buffer menu item should render before every other add-menu action",
    );
  }
});
