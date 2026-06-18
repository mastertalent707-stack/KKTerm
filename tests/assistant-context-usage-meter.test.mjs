import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

test("AssistantPanel renders context usage meter from stream events", async () => {
  const source = await readFile("src/ai/AssistantPanel.tsx", "utf8");
  const styles = await readFile("src/ai/assistant.css", "utf8");

  assert.match(
    source,
    /event\.type === "contextUsage"[\s\S]*setContextUsage\(event\.usage\)/,
    "contextUsage stream events should update panel state",
  );
  assert.match(
    source,
    /className="assistant-context-usage-button"/,
    "assistant composer footer should render the context usage meter button",
  );
  assert.match(
    source,
    /className="assistant-context-usage-popover"/,
    "clicking the meter should expose the detailed context usage popover",
  );
  assert.match(
    source,
    /t\("ai\.contextUsageTokens"/,
    "usage details should be localized instead of hard-coded",
  );
  assert.match(
    styles,
    /grid-template-columns: 29px minmax\(0, 1fr\) 16px minmax\(0, 1fr\) 29px;/,
    "context usage trigger should occupy a compact inline footer slot",
  );
  assert.match(
    styles,
    /\.assistant-context-usage-button \{[\s\S]*?width: 16px;[\s\S]*?height: 16px;[\s\S]*?color: var\(--text-faint\);/,
    "context usage trigger should stay compact and muted",
  );
  assert.match(
    styles,
    /\.assistant-context-usage-ring \{[\s\S]*?width: 12px;[\s\S]*?height: 12px;[\s\S]*?mask: radial-gradient\(farthest-side, transparent calc\(100% - 2px\), #000 0\);/,
    "context usage ring should render as a small thin-stroke circle",
  );
});
