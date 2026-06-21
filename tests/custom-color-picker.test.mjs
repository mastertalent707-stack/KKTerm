import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared rainbow picker is available on each raw-color palette", async () => {
  const [picker, connectionPicker, quickCommands, dashboard] = await Promise.all([
    read("src/app/ui/ColorPalettePicker.tsx"),
    read("src/modules/workspace/connections/ConnectionIconBackgroundPicker.tsx"),
    read("src/modules/workspace/connections/terminal/QuickCommandBar.tsx"),
    read("src/modules/dashboard/edit/CustomizePopover.tsx"),
  ]);

  assert.match(picker, /HexColorPicker/);
  assert.match(picker, /common\.customColor/);
  assert.match(picker, /common\.hexColor/);
  for (const consumer of [connectionPicker, quickCommands, dashboard]) {
    assert.match(consumer, /<ColorPalettePicker/);
  }
});

test("custom accents are restricted to full six-digit hex colors", async () => {
  const [palette, validation] = await Promise.all([
    read("src/modules/dashboard/registry/palette.ts"),
    read("src-tauri/src/dashboard_validation.rs"),
  ]);

  assert.match(palette, /\^#\[0-9a-f\]\{6\}\$/i);
  assert.match(validation, /value\.len\(\) == 7/);
  assert.match(validation, /is_ascii_hexdigit/);
});
