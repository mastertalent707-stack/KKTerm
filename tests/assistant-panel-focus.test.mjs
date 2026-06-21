import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("AI Assistant composer focus preserves shell scroll position", async () => {
  const source = await readFile(new URL("../src/ai/AssistantPanel.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /function focusWithoutScrolling\(element: HTMLElement \| null \| undefined\)[\s\S]*?element\?\.focus\(\{\s*preventScroll:\s*true\s*\}\)/,
    "Assistant focus should opt out of browser scroll-into-view behavior",
  );
  assert.doesNotMatch(
    source,
    /composerTextareaRef\.current\?\.focus\(\)/,
    "Composer focus should go through the preventScroll helper",
  );
  assert.doesNotMatch(
    source,
    /(?<!\.)textarea\.focus\(\)/,
    "Composer textarea focus should use preventScroll",
  );
});
