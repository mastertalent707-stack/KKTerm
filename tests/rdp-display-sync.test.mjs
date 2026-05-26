import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("RDP dynamic display sync does not fall back to ActiveX Reconnect", async () => {
  const rdpSource = await readFile(new URL("../src-tauri/src/rdp.rs", import.meta.url), "utf8");
  const resizeFunction = rdpSource.match(
    /fn resize_remote_desktop\([\s\S]*?\n    fn show_rdp\(/,
  )?.[0];

  assert.ok(resizeFunction, "resize_remote_desktop function should exist");
  assert.match(
    resizeFunction,
    /UpdateSessionDisplaySettings/,
    "dynamic display sync should use UpdateSessionDisplaySettings",
  );
  assert.doesNotMatch(
    resizeFunction,
    /"Reconnect"/,
    "dynamic display sync must retry UpdateSessionDisplaySettings instead of reconnecting the ActiveX session",
  );
});
