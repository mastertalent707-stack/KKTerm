import assert from "node:assert/strict";
import test from "node:test";
import type { Rack, Site } from "../src/types";
import { createItOpsPdfBytes, rackPdfDocument, type ItOpsExportLabels } from "../src/modules/itops/itopsExport";

const labels: ItOpsExportLabels = {
  devices: "Devices", noRacks: "No racks", noDevices: "No devices", inventory: "Inventory",
  rack: "Rack", group: "Group", ungrouped: "Ungrouped", startU: "Start U", heightU: "Height U",
  type: "Type", label: "Label", status: "Status", connection: "Connection", specs: "Specs", tags: "Tags",
  deviceCount: (count) => `${count} devices`, statusLabel: (status) => status,
};
const site = { id: "site-1", name: "Taipei", connectionIds: [], filter: null } as Site;
const rack = {
  id: "rack-1", siteId: site.id, name: "Core Rack", serverRoom: "Room A", rackGroup: "Network",
  heightU: 42, depthMm: 1000,
  items: [{ id: "device-1", rackId: "rack-1", kind: "switch", label: "Distribution Switch",
    startU: 20, heightU: 2, metadata: { status: "warning", ports: 48, tags: ["core"] } }],
} as Rack;

test("IT Ops PDF contains vector rack graphics and inventory data", () => {
  const document = rackPdfDocument({ site, rack, roomName: rack.serverRoom, unassignedLabel: "Unassigned",
    labels, kindLabel: (kind) => kind });
  const pdf = new TextDecoder().decode(createItOpsPdfBytes(document));
  assert.match(pdf, /^%PDF-1\.4/);
  assert.match(pdf, /\/MediaBox \[0 0 792 612\]/);
  assert.match(pdf, /Distribution Switch/);
  assert.match(pdf, /Inventory/);
  assert.match(pdf, / re B/);
  assert.match(pdf, / m .* l S/);
  assert.ok((pdf.match(/\/Type \/Page\b/g) ?? []).length >= 2);
});
