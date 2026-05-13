import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("URL child webviews rely on explicit placeholder bounds instead of Tauri auto resize", async () => {
  const source = await readFile(
    new URL("../src-tauri/src/webview.rs", import.meta.url),
    "utf8",
  );

  assert.equal(
    source.includes(".auto_resize()"),
    false,
    "Tauri auto_resize uses host-window ratios and can resize URL WebView2 across app chrome such as the AI Assistant panel",
  );
});
