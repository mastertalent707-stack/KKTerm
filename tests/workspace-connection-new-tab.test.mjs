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
  assert.match(storeSource, /function createPaneId\(connectionId: string\)/);
  assert.doesNotMatch(
    storeSource,
    /id:\s*`pane-\$\{connection\.id\}-\$\{Date\.now\(\)\}`/,
    "panorama panes need unique ids even when multiple children are opened in one millisecond",
  );
  assert.doesNotMatch(
    storeSource,
    /if \(existingGroupTab\) \{\s*set\(\{ activeTabId: existingGroupTab\.id \}\);\s*return;\s*\}/,
    "parent clicks should refresh an existing Child Connection Tab panorama instead of only activating it",
  );
  assert.match(
    storeSource,
    /childConnectionGroupParentId: connection\.id,[\s\S]*?focusedPaneId: undefined,/,
    "parent panorama activation should not mark a child row as selected in the Connection Tree",
  );
  assert.match(
    storeSource,
    /maximizeChildConnectionPane:\s*\(tabId,\s*paneId\)/,
    "Child Connection Tab activation from a parent panorama should maximize that pane",
  );
  assert.match(
    storeSource,
    /maximizedPaneId: undefined/,
    "parent panorama activation should restore the full child panorama",
  );
  assert.match(
    sidebarSource,
    /maximizeChildConnectionPane\(existingChildLocation\.tab\.id,\s*existingChildLocation\.pane\.id\)/,
    "clicking a child row inside an existing parent panorama should use the maximize path",
  );
  assert.match(
    storeSource,
    /closeChildConnection:\s*\(childConnectionId\)/,
    "closing a Child Connection Tab should close by child id rather than by parent panorama tab id",
  );
  assert.match(
    storeSource,
    /CHILD_CONNECTION_CLOSED_EVENT/,
    "closing from a terminal pane should notify the Connection Tree to remove the child row",
  );
  assert.match(
    sidebarSource,
    /label: t\("common\.close"\)/,
    "Child Connection Tab context menu should include Close",
  );
  assert.match(
    sidebarSource,
    /<span className=\{`status-dot \$\{connected \? "connected" : "idle"\}`\}/,
    "Child Connection Tab rows should show their own connection status dot",
  );
  assert.match(
    sidebarSource,
    /isActiveParent=\{isActiveParent\}/,
    "parent Connection rows should keep their own active highlight",
  );
  assert.match(
    sidebarSource,
    /activeTab\?\.childConnectionGroupParentId === connection\.id && !activeTab\.focusedPaneId/,
    "parent panorama selection should not also mean child-row selection",
  );
  assert.match(
    sidebarSource,
    /const isConnected = \(activeSessionCounts\[menu\.connection\.id\] \?\? 0\) > 0;/,
    "connected Connection rows should expose a Close Connection menu item",
  );
  assert.match(
    sidebarSource,
    /label: t\("connections\.closeConnection"\)/,
    "Close Connection must be translated through i18n",
  );
  assert.match(
    sidebarSource,
    /function handleTreeMenuCloseConnection\(menu: TreeContextMenuState\)/,
    "Close Connection should close open tabs for that durable Connection",
  );
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
