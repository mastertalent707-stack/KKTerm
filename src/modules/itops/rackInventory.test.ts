/// <reference types="node" />

import assert from "node:assert/strict";
import test from "node:test";
import type { RackItem, RackItemMetadata } from "../../types";
import {
  normalizeRackItemMetadata,
  selectRandomRackCallouts,
  summarizeRackDeviceMetadata,
} from "./rackInventory";

test("normalizeRackItemMetadata preserves legacy PR metadata while producing typed records", () => {
  const legacy: RackItemMetadata = {
    tags: [" core ", "", "edge"],
    auditRecords: ["上架 2026-06-29", "maintenance"],
    connectionIds: ["conn-1", "conn-1", "conn-2"],
    networkPorts: ["1:gigabit", "2:10g"],
    snmp: "public@192.0.2.10:1.3.6.1.2.1.2",
    relationship: "Host/VM",
    vendor: "Dell",
  };

  const normalized = normalizeRackItemMetadata(legacy);

  assert.deepEqual(normalized.tags, ["core", "edge"]);
  assert.deepEqual(normalized.auditRecords?.map((record) => record.action), ["installed", "maintenance"]);
  assert.deepEqual(normalized.connectionIds, ["conn-1", "conn-2"]);
  assert.deepEqual(normalized.networkPorts?.map((port) => [port.name, port.speed]), [
    ["1", "gigabit"],
    ["2", "10g"],
  ]);
  assert.equal(normalized.snmp?.target, "192.0.2.10");
  assert.equal(normalized.relationship?.kind, "hostVm");
  assert.equal(normalized.vendor, "dell");
});

test("summarizeRackDeviceMetadata returns compact visible inventory facts", () => {
  const summary = summarizeRackDeviceMetadata({
    tags: ["core", "edge"],
    relationship: { kind: "vsan", label: "VSAN cluster" },
    ipam: { addresses: [{ address: "10.0.0.4", family: "ipv4", role: "management" }] },
    networkPorts: [{ name: "xe-0/0/1", speed: "10g", state: "up" }],
  });

  assert.deepEqual(summary, ["VSAN cluster", "10.0.0.4", "xe-0/0/1 10G up"]);
});

test("normalizes IPAM addresses for rack device summaries", () => {
  const metadata = normalizeRackItemMetadata({
    ipam: {
      addresses: [
        {
          address: " 10.0.0.5 ",
          family: "ipv4",
          role: "management",
          vlan: "10",
          mac: "00:11:22:33:44:55",
        },
      ],
    },
  });

  assert.deepEqual(metadata.ipam?.addresses, [
    { address: "10.0.0.5", family: "ipv4", role: "management", vlan: "10", mac: "00:11:22:33:44:55" },
  ]);
});

test("relationship kinds normalize to typed visual categories", () => {
  assert.equal(normalizeRackItemMetadata({ relationship: "Host/VM" }).relationship?.kind, "hostVm");
  assert.equal(normalizeRackItemMetadata({ relationship: "storage/AP" }).relationship?.kind, "storageAp");
  assert.equal(normalizeRackItemMetadata({ relationship: "VSAN" }).relationship?.kind, "vsan");
  assert.equal(normalizeRackItemMetadata({ relationship: "SAN" }).relationship?.kind, "san");
  assert.equal(normalizeRackItemMetadata({ relationship: "NAS" }).relationship?.kind, "nas");
  assert.equal(normalizeRackItemMetadata({ relationship: "hyper convergence" }).relationship?.kind, "hyperConverged");
});

test("selectRandomRackCallouts deterministically chooses notes and bound connections", () => {
  const items = [
    { id: "a", label: "A", metadata: { notes: "Note A", connectionIds: ["conn-a"] } },
    { id: "b", label: "B", metadata: { tags: ["edge"] } },
    { id: "c", label: "C", metadata: { notes: "Note C", connectionIds: ["conn-c"] } },
  ] as RackItem[];

  const callouts = selectRandomRackCallouts(items, "rack-1", 2);

  assert.equal(callouts.length, 2);
  assert.ok(callouts.every((callout) => callout.text || callout.connectionIds.length > 0));
});
