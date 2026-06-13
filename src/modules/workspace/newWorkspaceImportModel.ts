import type { Connection, ConnectionType } from "../../types";

export type WorkspaceImportTypeFilter = ConnectionType | "all";

const CONNECTION_TYPE_ORDER: ConnectionType[] = [
  "local",
  "ssh",
  "telnet",
  "serial",
  "url",
  "rdp",
  "vnc",
  "ftp",
  "localFiles",
];

export function filterWorkspaceImportConnections(
  connections: Connection[],
  {
    query,
    type,
  }: {
    query: string;
    type: WorkspaceImportTypeFilter;
  },
) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return connections.filter((connection) => {
    if (type !== "all" && connection.type !== type) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }
    return connection.name.toLocaleLowerCase().includes(normalizedQuery);
  });
}

export function getWorkspaceImportTypeOptions(
  connections: Connection[],
): WorkspaceImportTypeFilter[] {
  const present = new Set(connections.map((connection) => connection.type));
  return [
    "all",
    ...CONNECTION_TYPE_ORDER.filter((type) => present.has(type)),
  ];
}

export function nextWorkspaceImportSelection(
  selectedIds: Set<string>,
  visibleIds: string[],
  select: boolean,
) {
  const next = new Set(selectedIds);
  for (const id of visibleIds) {
    if (select) {
      next.add(id);
    } else {
      next.delete(id);
    }
  }
  return next;
}
