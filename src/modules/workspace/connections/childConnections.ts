import type { DashboardBackground } from "../../dashboard/types";
import type { WorkspaceChildConnection, WorkspacePane, WorkspaceTab } from "../../../types";

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
