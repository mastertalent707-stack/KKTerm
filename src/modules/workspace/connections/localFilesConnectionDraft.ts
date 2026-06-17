import type { CreateConnectionRequest } from "../../../types";

function folderNameFromPath(path: string) {
  const parts = path.trim().replace(/[\\/]+$/g, "").split(/[\\/]+/).filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

// Build a File Explorer (localFiles) Connection draft for a dropped folder. It
// uses the default File Explorer settings (no custom icon) and names the
// Connection after the dropped folder's last path segment.
export function buildLocalFilesConnectionDraftFromPath(
  directoryPath: string,
  options: { workspaceId?: string; folderId?: string } = {},
): CreateConnectionRequest {
  const name = folderNameFromPath(directoryPath) || directoryPath;
  const draft: CreateConnectionRequest = {
    name,
    host: "localhost",
    user: "local",
    type: "localFiles",
    localStartupDirectory: directoryPath,
  };
  if (options.workspaceId) {
    draft.workspaceId = options.workspaceId;
  }
  if (options.folderId) {
    draft.folderId = options.folderId;
  }
  return draft;
}
