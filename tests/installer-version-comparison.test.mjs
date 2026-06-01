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

test("installer update comparison treats trailing zero build segments as equal", async () => {
  const { isInstallerUpdateAvailable } = await importTypeScriptModule(
    new URL("../src/modules/installer/versionCompare.ts", import.meta.url),
  );

  assert.equal(isInstallerUpdateAvailable("26.01", "26.01.00.0"), false);
  assert.equal(isInstallerUpdateAvailable("26.01.00.0", "26.01"), false);
});

test("installer update comparison requires the latest version to be greater", async () => {
  const { isInstallerUpdateAvailable } = await importTypeScriptModule(
    new URL("../src/modules/installer/versionCompare.ts", import.meta.url),
  );

  assert.equal(isInstallerUpdateAvailable("26.02", "26.01.00.0"), true);
  assert.equal(isInstallerUpdateAvailable("25.99", "26.01.00.0"), false);
  assert.equal(isInstallerUpdateAvailable(null, "26.01.00.0"), false);
  assert.equal(isInstallerUpdateAvailable("26.02", null), false);
});
