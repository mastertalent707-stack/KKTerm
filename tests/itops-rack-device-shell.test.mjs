import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("rack device explicit metallic black overrides a white rack shell", async () => {
  const [deviceSource, cssSource] = await Promise.all([
    readFile(new URL("../src/modules/itops/RackDevice.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/modules/itops/itops.css", import.meta.url), "utf8"),
  ]);

  assert.match(
    deviceSource,
    /data-shell=\{shell \?\? undefined\}/,
    "RackDevice should emit data-shell for an explicit black device shell",
  );
  assert.match(
    cssSource,
    /\.itops-page \.rkd\[data-shell="black"\]\s*\{[\s\S]*--rkd-face-mid:\s*#28282b;/,
    "explicit black devices need their own palette so they do not inherit a white cabinet palette",
  );
});
