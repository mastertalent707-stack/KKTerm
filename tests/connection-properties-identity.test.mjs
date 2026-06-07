import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Connection properties resolves duplicate display names by durable id", async () => {
  const sidebarSource = await readFile(
    new URL("../src/modules/workspace/connections/ConnectionSidebar.tsx", import.meta.url),
    "utf8",
  );
  const treeUtilsSource = await readFile(
    new URL("../src/modules/workspace/connections/treeUtils.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    treeUtilsSource,
    /export function findConnectionInTree\([\s\S]*connectionId: string[\s\S]*\)/,
    "Connection Tree should expose an id-based lookup for properties/edit flows",
  );
  assert.match(
    treeUtilsSource,
    /tree\.connections\.find\(\(connection\) => connection\.id === connectionId\)/,
    "root Connections should be matched by durable id, not display name",
  );
  assert.match(
    treeUtilsSource,
    /folder\.connections\.find\(\(entry\) => entry\.id === connectionId\)/,
    "folder Connections should be matched by durable id, not display name",
  );
  assert.match(
    treeUtilsSource,
    /return \{ connection, folderId: folder\.id \};/,
    "properties should preserve the containing folder when editing from flattened tree views",
  );
  assert.match(
    sidebarSource,
    /const currentConnection = findConnectionInTree\(treeRef\.current, menu\.connection\.id\);[\s\S]*setEditConnection\(currentConnection \?\? \{ connection: menu\.connection, folderId: menu\.folderId \}\);/,
    "opening Properties should refresh the target from the current raw tree by id",
  );
  assert.match(
    sidebarSource,
    /const currentConnection = findConnectionInTree\(treeRef\.current, editConnection\.connection\.id\);[\s\S]*id: currentConnection\.connection\.id,[\s\S]*type: currentConnection\.connection\.type,/,
    "saving Properties should update the current durable Connection id",
  );
});
