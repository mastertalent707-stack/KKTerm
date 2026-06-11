import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Connection Tree native context menu reuses Add Connection type submenu", async () => {
  const source = await readFile(
    new URL("../src/modules/workspace/connections/ConnectionSidebar.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /kind: "submenu",[\s\S]*?label: t\("connections\.newConnection"\),[\s\S]*?items: buildAddConnectionMenuItems\(\)/,
    "The tree context menu should ask for a Connection type through the shared Add Connection submenu.",
  );
  assert.doesNotMatch(
    source,
    /function handleTreeMenuCreateConnection\(\) \{[\s\S]*?handleNewConnectionTypeSelected\("local"\);[\s\S]*?\}/,
    "The fallback tree menu should not silently create a local terminal Connection.",
  );
});
