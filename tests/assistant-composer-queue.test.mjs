import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Assistant composer queues follow-up prompts while a response is running", async () => {
  const source = await readFile(new URL("../src/ai/AssistantPanel.tsx", import.meta.url), "utf8");

  assert.match(source, /type AssistantQueuedPrompt = \{/);
  assert.match(source, /const \[assistantPromptQueue, setAssistantPromptQueue\] = useState<AssistantQueuedPrompt\[\]>\(\[\]\);/);
  assert.match(source, /function queueAssistantPrompt\(/);
  assert.match(source, /if \(isSendingPrompt\) \{\s*queueAssistantPrompt\(normalizedPrompt, requestIntent\);/);
  assert.match(source, /function runQueuedAssistantPrompt\(/);
  assert.match(source, /runQueuedAssistantPrompt\(\);/);
  assert.match(source, /className="assistant-prompt-queue"/);
  assert.match(source, /Trash2 size=\{13\}/);

  const textareaBlock = source.match(/<textarea[\s\S]*?\/>/)?.[0] ?? "";
  assert.doesNotMatch(textareaBlock, /disabled=\{isSendingPrompt\}/);

  assert.match(source, /data-state=\{isSendingPrompt && !prompt\.trim\(\) \? "stopping" : "sending"\}/);
  assert.match(source, /onClick=\{isSendingPrompt && !prompt\.trim\(\) \? handleStopAssistantPrompt : undefined\}/);
  assert.match(source, /type=\{isSendingPrompt && !prompt\.trim\(\) \? "button" : "submit"\}/);
});
