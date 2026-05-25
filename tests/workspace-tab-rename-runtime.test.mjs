import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Workspace Tab rename is runtime-only per Tab", async () => {
  const storeSource = await readFile(new URL("../src/store.ts", import.meta.url), "utf8");
  const manualSource = await readFile(
    new URL("../docs/manual/04-workspace-tabs-panes.md", import.meta.url),
    "utf8",
  );

  const renameTabBody = storeSource.match(/renameTab: async \(tabId, title\) => \{([\s\S]*?)\n  \},\r?\n  closeAllTabs:/)?.[1] ?? "";
  assert.ok(renameTabBody, "renameTab implementation should be discoverable");
  assert.doesNotMatch(renameTabBody, /update_connection_tab_title/);
  assert.doesNotMatch(renameTabBody, /refreshOpenConnectionMetadata/);
  assert.match(renameTabBody, /tab\.id === tabId \? \{ \.\.\.tab, displayTitle \} : tab/);

  assert.doesNotMatch(storeSource, /displayTitle: connection\.tabTitle/);
  assert.doesNotMatch(storeSource, /displayTitle: connection\.tabTitle \?\? tab\.displayTitle/);
  assert.match(manualSource, /Tab rename is runtime-only/);
});
