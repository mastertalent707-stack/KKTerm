import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("settings navigation keeps the assistant panel mounted", async () => {
  const appSource = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const assistantRender = appSource.match(/\n\s*<AssistantPanel[\s\S]*?\n\s*\/>/);

  assert.ok(assistantRender, "App should render AssistantPanel.");
  assert.doesNotMatch(
    appSource,
    /activePage\s*!==\s*"settings"\s*\?\s*\(\s*<AssistantPanel/,
    "AssistantPanel must stay mounted when Settings is active so in-flight AI work can continue.",
  );
});

test("settings mode visually suppresses the mounted assistant panel", async () => {
  const cssSource = await readFile(new URL("../src/App.css", import.meta.url), "utf8");

  assert.match(
    cssSource,
    /\.settings-mode\s+\.assistant-panel\s*\{[\s\S]*?visibility:\s*hidden;/,
    "Settings should hide the still-mounted assistant panel from view.",
  );
  assert.match(
    cssSource,
    /\.settings-mode\s+\.assistant-panel\s*\{[\s\S]*?pointer-events:\s*none;/,
    "Settings should prevent pointer interaction with the hidden assistant panel.",
  );
});
