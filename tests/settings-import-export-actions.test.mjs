import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Settings data actions expose only selective Import and Export buttons", async () => {
  const source = await readFile(new URL("../src/modules/settings/GeneralSettings.tsx", import.meta.url), "utf8");
  const actionsStart = source.indexOf('className="settings-data-actions settings-merged-block"');
  const actionsEnd = source.indexOf("</div>", actionsStart);
  const actionsBlock = source.slice(actionsStart, actionsEnd);

  assert.match(actionsBlock, /setSelectiveExportOpen\(true\)/);
  assert.match(actionsBlock, /setSelectiveImportOpen\(true\)/);
  assert.doesNotMatch(actionsBlock, /handleExportSettings/);
  assert.doesNotMatch(actionsBlock, /setImportDialogOpen\(true\)/);
  assert.doesNotMatch(actionsBlock, /settings\.selectiveExport/);
  assert.doesNotMatch(actionsBlock, /settings\.selectiveImport/);
});
