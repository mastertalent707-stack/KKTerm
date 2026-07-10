import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Rack View picker uses compact faceplates without duplicate captions", async () => {
  const sites = await read("src/modules/itops/SitesTab.tsx");
  const pickerStart = sites.indexOf("function RackObjectPicker");
  const pickerEnd = sites.indexOf("function SiteRoomCards", pickerStart);
  const picker = sites.slice(pickerStart, pickerEnd);

  assert.match(picker, /<RackDevice[\s\S]*compact/);
  assert.match(picker, /aria-label=\{label\}/);
  assert.doesNotMatch(picker, /rm-picker-name/);
});

test("Blank stays blank while Label exposes its faceplate text", async () => {
  const device = await read("src/modules/itops/RackDevice.tsx");

  assert.match(device, /const isBlankPlate = kind === "blank"/);
  assert.match(device, /const isLabel = kind === "label"/);
  assert.match(device, /const hasName = !!label && !isBlankPlate/);
});

test("Server Tower form factor is stored and rendered at half width", async () => {
  const dialog = await read("src/modules/itops/RackItemDialog.tsx");
  const device = await read("src/modules/itops/RackDevice.tsx");
  const styles = await read("src/modules/itops/itops.css");

  assert.match(dialog, /formFactorLabel/);
  assert.match(dialog, /\["rack", "tower"\]/);
  assert.match(dialog, /formFactor: kind === "server" \? formFactor : null/);
  assert.match(device, /data-form-factor=\{isServer \? formFactor \?\? "rack" : undefined\}/);
  assert.match(styles, /\.rkd\[data-form-factor="tower"\][\s\S]*width: 50%/);
});

