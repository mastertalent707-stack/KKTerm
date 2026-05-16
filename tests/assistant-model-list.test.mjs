import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("assistant model selector uses the resolved provider model list", async () => {
  const assistantSource = await readFile(
    new URL("../src/ai/AssistantPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    assistantSource,
    /const\s+assistantModelOptions\s*=/,
    "AssistantPanel should derive model options from fetched provider models when available.",
  );
  assert.match(
    assistantSource,
    /\{assistantModelOptions\.map\(\(model\)\s*=>/,
    "AssistantPanel should render the resolved model list, not only registry defaults.",
  );
  assert.doesNotMatch(
    assistantSource,
    /\{providerDefinition\.modelOptions\.map\(\(model\)\s*=>/,
    "AssistantPanel must not render only providerDefinition.modelOptions.",
  );
});
