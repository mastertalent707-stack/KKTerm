import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../src/modules/workspace/connections/connection-dialog/UrlConnectionFields.tsx", import.meta.url),
  "utf8",
);

const sidebarSource = await readFile(
  new URL("../src/modules/workspace/connections/ConnectionSidebar.tsx", import.meta.url),
  "utf8",
);

const fieldsSection = source.slice(
  source.indexOf("export function UrlConnectionFields"),
  source.indexOf("export function UrlConnectionOptions"),
);
const optionsSection = source.slice(source.indexOf("export function UrlConnectionOptions"));

assert.doesNotMatch(
  fieldsSection,
  /name="dataPartition"/,
  "URL data shard should live in the right-column type options, not the primary URL fields.",
);

const inheritDefaultsIndex = optionsSection.indexOf('name="urlProxyInheritDefaults"');
const dataPartitionIndex = optionsSection.indexOf('name="dataPartition"');
const proxyModeIndex = optionsSection.indexOf('name="urlProxyMode"');
assert.ok(
  inheritDefaultsIndex !== -1 && dataPartitionIndex !== -1 && proxyModeIndex !== -1,
  "URL options should include inherit defaults, data shard, and proxy controls.",
);
assert.ok(
  inheritDefaultsIndex < dataPartitionIndex && dataPartitionIndex < proxyModeIndex,
  "URL data shard should appear in the right-column options below inherit defaults and above proxy controls.",
);

assert.match(
  optionsSection,
  /const displayedDataPartition = inheritsDefaults[\s\S]*urlSettings\.defaultDataPartition/,
  "URL data shard should display the Settings default while inherit defaults is on.",
);

assert.match(
  optionsSection,
  /disabled=\{inheritsDefaults\}[\s\S]*name="dataPartition"/,
  "URL data shard should be disabled while inheriting Settings defaults.",
);

assert.match(
  sidebarSource,
  /const dataPartition =[\s\S]*urlProxyInheritDefaults[\s\S]*urlSettings\.defaultDataPartition/,
  "URL submit handling should save the displayed Settings data shard while inherit defaults is on.",
);
