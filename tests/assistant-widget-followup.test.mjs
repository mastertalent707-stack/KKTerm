import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function importTypeScriptModule(path) {
  const source = await readFile(path, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2020,
      target: ts.ScriptTarget.ES2020,
      verbatimModuleSyntax: true,
    },
  });
  const encoded = encodeURIComponent(transpiled.outputText);
  return import(`data:text/javascript;charset=utf-8,${encoded}`);
}

const duplicateChoiceMessage = `I found an existing widget that already matches your request:

- **Round Clock** - a polished round analog clock widget with a glass face and live time label.

I can do one of these:

1. **Edit existing** - modify **"Round Clock"** to fit your new request.
2. **Create new** - keep **"Round Clock"** and add a separate round clock widget.
3. **Place it** - drop **"Round Clock"** onto the current view.

Reply with **1**, **2**, or **3**.`;

test("create-widget duplicate follow-up expands new into an explicit create-new request", async () => {
  const { resolveCreateWidgetFollowupPrompt } = await importTypeScriptModule(
    new URL("../src/ai/widgetFollowupPrompt.ts", import.meta.url),
  );

  const resolved = resolveCreateWidgetFollowupPrompt("new", [
    {
      role: "user",
      content: "a round clock widget",
      intent: "createWidget",
    },
    {
      role: "assistant",
      content: duplicateChoiceMessage,
      intent: "createWidget",
    },
  ]);

  assert.match(resolved, /option 2, Create new/);
  assert.match(resolved, /Original widget request: a round clock widget/);
  assert.match(resolved, /Matched existing widget: Round Clock/);
  assert.match(resolved, /Do not ask the duplicate-widget choice question again/);
});

test("create-widget duplicate follow-up leaves ordinary widget prompts untouched", async () => {
  const { resolveCreateWidgetFollowupPrompt } = await importTypeScriptModule(
    new URL("../src/ai/widgetFollowupPrompt.ts", import.meta.url),
  );

  assert.equal(
    resolveCreateWidgetFollowupPrompt("new york weather widget", [
      {
        role: "assistant",
        content: duplicateChoiceMessage,
        intent: "createWidget",
      },
    ]),
    "new york weather widget",
  );
});

test("create-widget duplicate follow-up expands place into an explicit place request", async () => {
  const { resolveCreateWidgetFollowupPrompt } = await importTypeScriptModule(
    new URL("../src/ai/widgetFollowupPrompt.ts", import.meta.url),
  );

  const resolved = resolveCreateWidgetFollowupPrompt("3", [
    {
      role: "user",
      content: "a round clock widget",
      intent: "createWidget",
    },
    {
      role: "assistant",
      content: duplicateChoiceMessage,
      intent: "createWidget",
    },
  ]);

  assert.match(resolved, /option 3, Place it/);
  assert.match(resolved, /Place the matched existing widget/);
});
