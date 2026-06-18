import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("built-in MCP settings are only presented on supported Windows builds", async () => {
  const source = await readFile(
    new URL("../src/modules/settings/AiSettings.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /import \{ isWindowsPlatform \} from "\.\.\/\.\.\/lib\/platform"/);
  assert.match(
    source,
    /isWindowsPlatform\(\)\s*\?\s*\([\s\S]*settings\.builtInMcpServerEnabled[\s\S]*settings\.builtInMcpAllowAllDangerous[\s\S]*\)\s*:\s*null/,
  );
});

test("built-in MCP config opens only from the explicit Show config button", async () => {
  const source = await readFile(
    new URL("../src/modules/settings/AiSettings.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /<div className="settings-toggle-row built-in-mcp-server-row">[\s\S]*setShowBuiltInMcpConfig\(true\)[\s\S]*<\/div>/,
  );
  assert.doesNotMatch(
    source,
    /<label className="settings-toggle-row built-in-mcp-server-row">/,
    "the config button must not be the label target for the server toggle",
  );
});
