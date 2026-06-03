import type { DashboardBackground } from "../../dashboard/types";
import type { WorkspaceChildConnection, WorkspacePane, WorkspaceTab } from "../../../types";

export const CHILD_CONNECTIONS_STORAGE_KEY = "kkterm.workspace.childConnections.v1";

export function loadStoredChildConnections(): WorkspaceChildConnection[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CHILD_CONNECTIONS_STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter(isStoredChildConnection) : [];
  } catch {
    return [];
  }
}

export function persistStoredChildConnections(children: WorkspaceChildConnection[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(CHILD_CONNECTIONS_STORAGE_KEY, JSON.stringify(children));
  } catch {
    // Storage can be unavailable or full; keep runtime state working.
  }
}

function isStoredChildConnection(value: unknown): value is WorkspaceChildConnection {
  if (!value || typeof value !== "object") {
    return false;
  }
  const child = value as Partial<WorkspaceChildConnection>;
  return (
    typeof child.id === "string" &&
    child.id.trim().length > 0 &&
    typeof child.parentConnectionId === "string" &&
    child.parentConnectionId.trim().length > 0 &&
    typeof child.name === "string" &&
    child.name.trim().length > 0
  );
}

function isTerminalWorkspacePane(pane: WorkspacePane): pane is WorkspacePane & { cwd: string } {
  return pane.kind === undefined || pane.kind === "terminal";
}

function backgroundsEqual(
  left: DashboardBackground | null | undefined,
  right: DashboardBackground | null | undefined,
) {
  return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
}

export function syncChildConnectionsFromTabs(
  children: WorkspaceChildConnection[],
  tabs: WorkspaceTab[],
): WorkspaceChildConnection[] {
  const paneByChildId = new Map<string, WorkspacePane>();
  for (const tab of tabs) {
    for (const pane of tab.panes) {
      if (pane.childConnectionId) {
        paneByChildId.set(pane.childConnectionId, pane);
      }
    }
  }

  let changed = false;
  const next = children.map((child) => {
    const pane = paneByChildId.get(child.id);
    if (!pane || !isTerminalWorkspacePane(pane)) {
      return child;
    }

    const cwd = pane.cwd.trim();
    const terminalOpacity = pane.connection?.terminalOpacity;
    const terminalBackground =
      "terminalBackground" in pane && pane.terminalBackground !== undefined
        ? pane.terminalBackground
        : pane.connection?.terminalBackground;
    const cwdChanged = Boolean(cwd) && child.cwd !== cwd;
    const opacityChanged = child.terminalOpacity !== terminalOpacity;
    const backgroundChanged = !backgroundsEqual(child.terminalBackground, terminalBackground);

    if (!cwdChanged && !opacityChanged && !backgroundChanged) {
      return child;
    }

    changed = true;
    return {
      ...child,
      cwd: cwdChanged ? cwd : child.cwd,
      terminalOpacity,
      terminalBackground,
    };
  });

  return changed ? next : children;
}
