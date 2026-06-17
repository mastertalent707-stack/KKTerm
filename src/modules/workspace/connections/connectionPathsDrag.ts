// Internal HTML5 drag-and-drop payload for creating Connections by dragging
// real local filesystem paths (from a File Explorer Connection pane) onto the
// Connection Tree. The app runs with the native Tauri drag-drop handler
// disabled (required for HTML5 DnD on Windows — see lib.rs
// `disable_drag_drop_handler`), so OS drops never reach `onDragDropEvent`;
// in-app drags carry the absolute paths here instead.
export const CONNECTION_PATHS_DRAG_MIME = "application/x-kkterm-connection-paths";

export function writeConnectionPathsDrag(dataTransfer: DataTransfer, paths: string[]) {
  const cleaned = Array.from(new Set(paths.map((path) => path.trim()).filter(Boolean)));
  if (cleaned.length === 0) {
    return;
  }
  dataTransfer.setData(CONNECTION_PATHS_DRAG_MIME, JSON.stringify(cleaned));
}

export function dragHasConnectionPaths(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.types).includes(CONNECTION_PATHS_DRAG_MIME);
}

export function readConnectionPathsDrag(dataTransfer: DataTransfer): string[] {
  try {
    const raw = dataTransfer.getData(CONNECTION_PATHS_DRAG_MIME);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((path): path is string => typeof path === "string");
  } catch {
    return [];
  }
}
