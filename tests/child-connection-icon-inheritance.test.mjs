import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const sidebarSource = await readFile(
  new URL("../src/modules/workspace/connections/ConnectionSidebar.tsx", import.meta.url),
  "utf8",
);
const storeSource = await readFile(new URL("../src/store.ts", import.meta.url), "utf8");
const terminalSource = await readFile(
  new URL("../src/modules/workspace/connections/terminal/TerminalWorkspace.tsx", import.meta.url),
  "utf8",
);
const connectionCss = await readFile(
  new URL("../src/modules/workspace/connections/connections.css", import.meta.url),
  "utf8",
);

test("new Child Connection Tabs inherit parent icons instead of snapshotting them", () => {
  const createChildBlock = sidebarSource.match(/async function createChildConnection[\s\S]*?return child;\r?\n  \}/)?.[0];
  assert.ok(createChildBlock, "createChildConnection should exist");
  assert.doesNotMatch(
    createChildBlock,
    /icon(?:BackgroundColor|DataUrl):\s*connection\.icon/,
    "creating a child should leave icon fields unset so later parent icon detection is inherited",
  );
  assert.match(
    storeSource,
    /function connectionForChild[\s\S]*iconBackgroundColor: child\.iconBackgroundColor \?\? connection\.iconBackgroundColor[\s\S]*iconDataUrl: child\.iconDataUrl \?\? connection\.iconDataUrl/,
    "opening a child should still render the parent icon unless the child has an override",
  );
});

test("open child panes preserve explicit icon overrides during parent metadata refresh", () => {
  assert.match(
    storeSource,
    /function refreshChildPaneConnection[\s\S]*current\.iconBackgroundColor !== parentBefore\?\.iconBackgroundColor[\s\S]*current\.iconDataUrl !== parentBefore\?\.iconDataUrl/,
    "metadata refresh should distinguish inherited child icons from child-specific overrides",
  );
});

test("SSH OS icon detection is marked done after one established probe attempt", () => {
  const detectBlock = terminalSource.match(/async function maybeAutoDetectOsIcon[\s\S]*?\r?\n\}/)?.[0];
  assert.ok(detectBlock, "maybeAutoDetectOsIcon should exist");
  assert.match(
    detectBlock,
    /finally\s*\{[\s\S]*markOsIconAutoDetectDone\(connection\.id\)/,
    "the done flag should be set even when an established probe finds no icon or throws",
  );
});

test("Connection icon backgrounds use rounded rectangles instead of circular badges", () => {
  assert.match(
    connectionCss,
    /\.connection-icon-shell\s*\{[\s\S]*border-radius:\s*6px;/,
    "saved child/parent icon background colors should render with the current rounded-rectangle shape",
  );
});
