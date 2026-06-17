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
  // The native Tauri drag-drop handler is disabled app-wide (required for HTML5
  // DnD on Windows), so the tree consumes an HTML5 drop carrying real paths
  // rather than Tauri's `onDragDropEvent` (which never fires).
  assert.doesNotMatch(
    sidebarSource,
    /onDragDropEvent/,
    "The tree must not rely on Tauri onDragDropEvent — it never fires with the drag-drop handler disabled.",
  );
  assert.match(
    sidebarSource,
    /onDrop=\{handleTreePathsDrop\}/,
    "The tree list should accept HTML5 path drops.",
  );
  assert.match(
    sidebarSource,
    /readConnectionPathsDrag\(event\.dataTransfer\)[\s\S]*handleExternalPathsDropped\(paths\)/,
    "Dropped connection paths should be routed through handleExternalPathsDropped.",
  );
});

test("A File Explorer (local) pane seeds connection paths when its rows are dragged", async () => {
  const paneSource = await readFile(
    new URL("../src/modules/workspace/connections/sftp/SftpFilePane.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    paneSource,
    /side === "local"[\s\S]*writeConnectionPathsDrag\(/,
    "The local file pane should attach absolute connection paths on drag start.",
  );
  assert.match(
    paneSource,
    /writeConnectionPathsDrag\([\s\S]*joinLocalPath\(path, name\)/,
    "Dragged rows should carry their absolute local filesystem paths.",
  );
});
