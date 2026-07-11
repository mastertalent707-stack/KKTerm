import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sites = await readFile(new URL("../src/modules/itops/SitesTab.tsx", import.meta.url), "utf8");
const library = await readFile(new URL("../src/modules/itops/TaskLibrary.tsx", import.meta.url), "utf8");
const schema = await readFile(new URL("../src-tauri/src/storage.rs", import.meta.url), "utf8");
const commands = await readFile(new URL("../src-tauri/src/lib.rs", import.meta.url), "utf8");

test("IT Ops navigator keeps Tasks global and Site operations virtual", () => {
  assert.match(sites, /itops\.navigation\.serverRooms/);
  assert.match(sites, /itops\.navigation\.runHistory/);
  assert.match(sites, /itops\.tasks\.heading/);
  assert.match(sites, /rootSurface === "tasks"/);
  assert.match(sites, /<TaskLibrary defaultSiteId=/);
});

test("Task Library launches saved definitions through the Batch Run path", () => {
  assert.match(library, /requestNewBatchRun\(defaultSiteId \?\? undefined, undefined, selected\.task\)/);
  assert.match(library, /const createTask = useItOpsStore/);
  assert.match(library, /const updateTask = useItOpsStore/);
});

test("Tasks are durable global rows with registered CRUD commands", () => {
  assert.match(schema, /CREATE TABLE IF NOT EXISTS itops_tasks/);
  const taskTable = schema.match(/CREATE TABLE IF NOT EXISTS itops_tasks \([\s\S]*?\n\);/)?.[0] ?? "";
  assert.doesNotMatch(taskTable, /site_id/);
  for (const command of ["itops_list_tasks", "itops_create_task", "itops_update_task", "itops_remove_task"]) {
    assert.match(commands, new RegExp(`task_commands::${command}`));
  }
});
