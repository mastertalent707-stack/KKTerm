import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Dashboard Connection widget tab creation does not allocate tmux ids during render", async () => {
  const source = await readFile(
    new URL("../src/modules/dashboard/widgets/builtin/connections/ConnectionWidget.tsx", import.meta.url),
    "utf8",
  );
  const createPaneStart = source.indexOf("function createConnectionWidgetPane");
  const bodyStart = source.indexOf("export function ConnectionWidgetBody");

  assert.notEqual(createPaneStart, -1, "Connection widget pane factory should exist");
  assert.notEqual(bodyStart, -1, "Connection widget body should exist");

  const paneFactory = source.slice(createPaneStart, bodyStart);
  assert.equal(
    paneFactory.includes("appendTmuxSessionId("),
    false,
    "pane factory must not mutate tmux localStorage while constructing render data",
  );
});
