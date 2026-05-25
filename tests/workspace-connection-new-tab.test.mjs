import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Connection Tree supports forced new Tabs from Ctrl-click and Add to menu", async () => {
  const sidebarSource = await readFile(
    new URL("../src/modules/workspace/connections/ConnectionSidebar.tsx", import.meta.url),
    "utf8",
  );
  const storeSource = await readFile(new URL("../src/store.ts", import.meta.url), "utf8");

  assert.match(storeSource, /openConnectionInNewTab:\s*\(\s*connection: Connection/);
  assert.match(storeSource, /createConnectionTabId\(connection\.id\)/);
  assert.match(storeSource, /openSftpBrowserInNewTab: \(connection: Connection\) => void/);
  assert.match(storeSource, /get\(\)\.openSftpBrowserInNewTab\(sshConnection\)/);
  assert.match(sidebarSource, /openConnectionInNewTab = useWorkspaceStore/);
  assert.match(sidebarSource, /event\.ctrlKey/);
  assert.match(sidebarSource, /handleOpenConnection\(connection,\s*\{\s*forceNewTab: true\s*\}\)/);
  assert.match(sidebarSource, /openTmuxSessionIdsForConnection\(connection\.id\)/);
  assert.match(sidebarSource, /newestUnattachedTmuxSession\(sessions,\s*openSessionIds\)/);
  assert.match(sidebarSource, /label: `\$\{t\("workspace\.newTab"\)\}\\t\$\{t\("connections\.newTabShortcut"\)\}`/);
  assert.match(sidebarSource, /action: \(\) => handleTreeMenuOpenNewTab\(menu\)/);
});
