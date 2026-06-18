import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Assistant composer resets template intent after submit clears the textarea", async () => {
  const source = await readFile(new URL("../src/ai/AssistantPanel.tsx", import.meta.url), "utf8");
  const body =
    source.match(/async function submitAssistantPrompt\(\) \{([\s\S]*?)\n  (?:async )?function denyAssistantToolApproval/)?.[1] ??
    "";

  assert.ok(body, "submitAssistantPrompt implementation should be discoverable");

  const promptClearCount = (body.match(/setPrompt\(""\);/g) ?? []).length;
  const intentResetCount = (body.match(/setAssistantIntent\("chat"\);/g) ?? []).length;
  const exampleResetCount = (body.match(/setDisplayedIntentExamples\(\[\]\);/g) ?? []).length;

  assert.equal(promptClearCount, 2, "submit should clear the composer on both handled paths");
  assert.equal(
    intentResetCount,
    promptClearCount,
    "clearing the composer should also clear the selected template intent",
  );
  assert.equal(
    exampleResetCount,
    promptClearCount,
    "clearing the composer should also clear selected template examples",
  );
});
