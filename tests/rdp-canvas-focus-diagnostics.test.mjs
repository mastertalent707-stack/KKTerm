import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("IronRDP canvas records focus and first key diagnostics", async () => {
  const source = await readFile(
    new URL("../src/modules/workspace/connections/remote-desktop/RdpCanvasView.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /function RdpCanvasView/);
  assert.match(source, /const focusInput = \(reason: string\) => \{/);
  assert.match(source, /input\.focus\(\{ preventScroll: true \}\)/);
  assert.match(source, /logUiDebug\("rdp\.canvas\.focus"/);
  assert.match(source, /inputFocused: document\.activeElement === input/);
  assert.match(source, /focusInput\("pointerdown"\)/);
  assert.match(source, /logUiDebug\("rdp\.canvas\.key"/);
});
