import type {
  RackAuditRecord,
  RackIpamAddress,
  RackItem,
  RackItemMetadata,
  RackNetworkPort,
  RackPortSpeed,
  RackRelationship,
  RackSnmpHint,
} from "../../types";

export type NormalizedRackItemMetadata = Omit<
  RackItemMetadata,
  "auditRecords" | "networkPorts" | "relationship" | "ipam" | "snmp"
> & {
  auditRecords?: RackAuditRecord[] | null;
  networkPorts?: RackNetworkPort[] | null;
  relationship?: RackRelationship | null;
  ipam?: { addresses: RackIpamAddress[] } | null;
  snmp?: RackSnmpHint | null;
};

function compact(values: (string | null | undefined)[]): string[] {
  return values.map((value) => value?.trim()).filter((value): value is string => !!value);
}

function trimOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeVendor(value: string | null | undefined): string | null {
  const trimmed = trimOrNull(value);
  return trimmed ? trimmed.toLowerCase() : null;
}

function auditActionFromText(value: string): RackAuditRecord["action"] {
  if (/上架|install/i.test(value)) return "installed";
  if (/下架|remove/i.test(value)) return "removed";
  if (/cabl|線|线/.test(value)) return "cabling";
  if (/maint|維護|维护/i.test(value)) return "maintenance";
  return "note";
}

function stableId(prefix: string, index: number, label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${prefix}-${index}${slug ? `-${slug}` : ""}`;
}

export function normalizeAuditRecords(value: RackItemMetadata["auditRecords"]): RackAuditRecord[] | null {
  if (!Array.isArray(value)) return null;
  const records = value.flatMap((entry, index) => {
    if (typeof entry === "string") {
      const label = entry.trim();
      return label
        ? [{ id: stableId("audit", index, label), action: auditActionFromText(label), label, occurredAt: null }]
        : [];
    }
    const label = entry?.label?.trim();
    return label ? [{ ...entry, label }] : [];
  });
  return records.length > 0 ? records : null;
}

export function normalizeConnectionIds(value: RackItemMetadata["connectionIds"]): string[] | null {
  const deduped = [...new Set(compact(Array.isArray(value) ? value : []))];
  return deduped.length > 0 ? deduped : null;
}

function normalizePortSpeed(value: string | null | undefined): RackPortSpeed {
  const speed = value?.trim().toLowerCase();
  if (speed === "10g") return "10g";
  if (speed === "25g") return "25g";
  if (speed === "40g") return "40g";
  if (speed === "100g") return "100g";
  if (speed === "gigabit" || speed === "1g") return "gigabit";
  return "custom";
}

export function normalizeNetworkPorts(value: RackItemMetadata["networkPorts"]): RackNetworkPort[] | null {
  if (!Array.isArray(value)) return null;
  const ports = value.flatMap((entry, index) => {
    if (typeof entry !== "string") {
      const name = trimOrNull(entry?.name);
      return name ? [{ ...entry, name, speed: normalizePortSpeed(entry.speed) }] : [];
    }
    const [nameRaw, speedRaw] = entry.split(":");
    const name = trimOrNull(nameRaw) ?? `${index + 1}`;
    return [{ name, speed: normalizePortSpeed(speedRaw ?? nameRaw) }];
  });
  return ports.length > 0 ? ports : null;
}

export function normalizeRelationship(value: RackItemMetadata["relationship"]): RackRelationship | null {
  if (!value) return null;
  if (typeof value !== "string") {
    const label = trimOrNull(value.label);
    return label ? { ...value, label } : null;
  }
  const label = value.trim();
  if (!label) return null;
  if (/host\s*\/?\s*vm/i.test(label)) return { kind: "hostVm", label };
  if (/storage\s*\/?\s*ap/i.test(label)) return { kind: "storageAp", label };
  if (/vsan/i.test(label)) return { kind: "vsan", label };
  if (/^san$/i.test(label)) return { kind: "san", label };
  if (/nas/i.test(label)) return { kind: "nas", label };
  if (/hyper/i.test(label)) return { kind: "hyperConverged", label };
  return { kind: "custom", label };
}

export function normalizeSnmpHint(value: RackItemMetadata["snmp"]): RackSnmpHint | null {
  if (!value) return null;
  if (typeof value !== "string") {
    const target = trimOrNull(value.target);
    return target ? { ...value, target } : null;
  }
  const raw = value.trim();
  if (!raw) return null;
  const [, targetAndOid = raw] = raw.split("@");
  const [target, ...oidParts] = targetAndOid.split(":");
  const normalizedTarget = trimOrNull(target);
  if (!normalizedTarget) return null;
  return { target: normalizedTarget, oid: trimOrNull(oidParts.join(":")) };
}

export function normalizeIpamAddresses(value: RackItemMetadata["ipam"]): RackIpamAddress[] | null {
  const addresses = value?.addresses.flatMap((entry) => {
    const address = trimOrNull(entry.address);
    return address
      ? [{
          ...entry,
          address,
          vlan: trimOrNull(entry.vlan),
          mac: trimOrNull(entry.mac),
        }]
      : [];
  }) ?? [];
  return addresses.length > 0 ? addresses : null;
}

export function normalizeRackItemMetadata(metadata: RackItemMetadata): NormalizedRackItemMetadata {
  return {
    ...metadata,
    tags: compact(metadata.tags ?? []),
    auditRecords: normalizeAuditRecords(metadata.auditRecords),
    connectionIds: normalizeConnectionIds(metadata.connectionIds),
    networkPorts: normalizeNetworkPorts(metadata.networkPorts),
    relationship: normalizeRelationship(metadata.relationship),
    snmp: normalizeSnmpHint(metadata.snmp),
    ipam: { addresses: normalizeIpamAddresses(metadata.ipam) ?? [] },
    vendor: normalizeVendor(metadata.vendor),
  };
}

export function summarizeRackDeviceMetadata(metadata: RackItemMetadata): string[] {
  const relationship = normalizeRelationship(metadata.relationship);
  const ip = normalizeIpamAddresses(metadata.ipam)?.[0]?.address;
  const port = normalizeNetworkPorts(metadata.networkPorts)?.[0];
  return compact([
    relationship?.label,
    ip,
    port ? `${port.name} ${port.speed.toUpperCase()} ${port.state ?? "unknown"}` : null,
    ...(metadata.tags ?? []).slice(0, 2),
  ]).slice(0, 3);
}

export interface RackInventoryCallout {
  itemId: string;
  label: string;
  text: string | null;
  connectionIds: string[];
}

export function selectRandomRackCallouts(items: RackItem[], seed: string, limit: number): RackInventoryCallout[] {
  const candidates = items.flatMap((item) => {
    const metadata = normalizeRackItemMetadata(item.metadata ?? {});
    const text = item.metadata?.notes?.trim() || metadata.tags?.slice(0, 2).join(", ") || null;
    const connectionIds = metadata.connectionIds ?? [];
    return text || connectionIds.length > 0
      ? [{ itemId: item.id, label: item.label, text, connectionIds }]
      : [];
  });
  return candidates
    .sort((a, b) => `${seed}:${a.itemId}`.localeCompare(`${seed}:${b.itemId}`))
    .slice(0, limit);
}
