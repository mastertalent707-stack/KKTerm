import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildLocalFilesConnectionDraftFromPath } from "../src/modules/workspace/connections/localFilesConnectionDraft.ts";

test("File Explorer drop drafts name the Connection after the last folder segment with default settings", () => {
  const draft = buildLocalFilesConnectionDraftFromPath("C:\\Users\\ryan\\Projects\\kkterm\\", {
    workspaceId: "workspace-1",
  });

  assert.deepEqual(draft, {
    name: "kkterm",
    host: "localhost",
    user: "local",
    type: "localFiles",
    workspaceId: "workspace-1",
    localStartupDirectory: "C:\\Users\\ryan\\Projects\\kkterm\\",
  });
});

test("File Explorer drop drafts do not attach a custom icon (default File Explorer glyph)", () => {
  const draft = buildLocalFilesConnectionDraftFromPath("/home/ryan/notes");
  assert.equal("iconDataUrl" in draft, false);
});

test("Dropping onto the Connection Tree routes folders to File Explorer and files to Document", async () => {
  const sidebarSource = await readFile(
    new URL("../src/modules/workspace/connections/ConnectionSidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    sidebarSource,
    /prepared\.fileKind === "folder"[\s\S]*buildLocalFilesConnectionDraftFromPath/,
    "Dropped folders should create File Explorer (localFiles) Connections.",
  );
  assert.match(
    sidebarSource,
    /buildFileViewConnectionDraftFromPath\(prepared\.path/,
    "Dropped files should create Document (fileView) Connections.",
  );
  assert.match(
    sidebarSource,
    /getCurrentWebview\(\)\s*\.onDragDropEvent/,
    "The tree should subscribe to OS drag-drop events.",
  );
});
