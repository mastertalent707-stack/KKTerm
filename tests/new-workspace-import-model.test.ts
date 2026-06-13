import assert from "node:assert/strict";
import test from "node:test";

import {
  filterWorkspaceImportConnections,
  getWorkspaceImportTypeOptions,
  nextWorkspaceImportSelection,
} from "../src/modules/workspace/newWorkspaceImportModel.ts";
import type { Connection, ConnectionType } from "../src/types.ts";

function connection(id: string, name: string, type: ConnectionType): Connection {
  return {
    id,
    name,
    host: `${id}.example.com`,
    user: "",
    type,
    status: "idle",
  };
}

const candidates = [
  connection("1", "Production shell", "ssh"),
  connection("2", "PowerShell", "local"),
  connection("3", "Docs web", "url"),
  connection("4", "Build server", "ssh"),
];

test("filterWorkspaceImportConnections filters by name and type while preserving source order", () => {
  assert.deepEqual(
    filterWorkspaceImportConnections(candidates, {
      query: "server",
      type: "ssh",
    }).map((entry) => entry.id),
    ["4"],
  );

  assert.deepEqual(
    filterWorkspaceImportConnections(candidates, {
      query: "shell",
      type: "all",
    }).map((entry) => entry.id),
    ["1", "2"],
  );
});

test("getWorkspaceImportTypeOptions exposes only types present in the selected source", () => {
  assert.deepEqual(getWorkspaceImportTypeOptions(candidates), ["all", "local", "ssh", "url"]);
});

test("nextWorkspaceImportSelection selects or deselects only the currently visible rows", () => {
  const selected = new Set(["1", "3"]);
  const visibleIds = ["2", "4"];

  assert.deepEqual([...nextWorkspaceImportSelection(selected, visibleIds, true)].sort(), [
    "1",
    "2",
    "3",
    "4",
  ]);

  assert.deepEqual([...nextWorkspaceImportSelection(selected, ["1"], false)].sort(), ["3"]);
});
