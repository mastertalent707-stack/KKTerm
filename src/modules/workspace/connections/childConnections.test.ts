import {
  focusedPaneIdForChildLayout,
  syncChildConnectionsFromTabs,
} from "./childConnections.ts";
import type { Connection, WorkspaceChildConnection, WorkspaceTab } from "../../../types";

const parentConnection: Connection = {
  id: "parent-1",
  name: "Parent",
  host: "example.com",
  user: "ryan",
  type: "ssh",
  status: "idle",
  terminalBackground: { kind: "preset", preset: "graphite" },
};

const child: WorkspaceChildConnection = {
  id: "child-1",
  parentConnectionId: parentConnection.id,
  name: "Child",
  cwd: "~",
};

const tab: WorkspaceTab = {
  id: "tab-parent-children",
  childConnectionGroupParentId: parentConnection.id,
  title: "Parent",
  subtitle: "ryan@example.com",
  kind: "terminal",
  panes: [
    {
      kind: "terminal",
      id: "pane-child-1",
      childConnectionId: child.id,
      title: "Child",
      toolbarTitle: "Child",
      cwd: "/home/ryan/project",
      buffer: "",
      connection: { ...parentConnection, terminalOpacity: 42 },
      terminalBackground: { kind: "dynamic", dynamic: "matrix" },
    },
  ],
  connection: parentConnection,
};

const synced = syncChildConnectionsFromTabs([child], [tab]);
const syncedChild = synced[0];

if (syncedChild?.cwd !== "/home/ryan/project") {
  throw new Error("Open child terminal cwd should sync into stored child metadata.");
}

if (syncedChild.terminalBackground?.kind !== "dynamic" || syncedChild.terminalBackground.dynamic !== "matrix") {
  throw new Error("Open child terminal background should sync into stored child metadata.");
}

if (syncedChild.terminalOpacity !== 42) {
  throw new Error("Open child terminal transparency should sync into stored child metadata.");
}

const focusedTab = { ...tab, focusedPaneId: "pane-child-1" };
const existingFocusedPane = focusedPaneIdForChildLayout(focusedTab, focusedTab.panes);
if (existingFocusedPane !== "pane-child-1") {
  throw new Error("Refreshing an existing child layout should preserve its focused Pane.");
}

const fallbackFocusedPane = focusedPaneIdForChildLayout(
  { ...tab, focusedPaneId: "missing-pane" },
  tab.panes,
);
if (fallbackFocusedPane !== undefined) {
  throw new Error("Refreshing a child layout with stale focus should leave the panorama focus unset.");
}

const initialFocusedPane = focusedPaneIdForChildLayout(undefined, tab.panes);
if (initialFocusedPane !== undefined) {
  throw new Error("Opening a child panorama without prior focus should not invent a focused child Pane.");
}
