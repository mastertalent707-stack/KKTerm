import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Terminal settings exposes custom shell profiles and feeds default shell choices", async () => {
  const source = await readFile(
    new URL("../src/modules/settings/TerminalSettings.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /settings\.customShells/);
  assert.match(source, /settings\.addCustomShell/);
  assert.match(source, /settings\.customShellName/);
  assert.match(source, /settings\.customShellCommandLine/);
  assert.match(source, /defaultShellSelectOptions\.map/);
});

test("Local terminal Connection shell selector receives custom shell profiles from Terminal settings", async () => {
  const [sidebarSource, utilsSource] = await Promise.all([
    readFile(new URL("../src/modules/workspace/connections/ConnectionSidebar.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/modules/workspace/connections/utils.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(sidebarSource, /terminalSettings\.customShells/);
  assert.match(sidebarSource, /localShellOptionsForPlatform\([^)]*terminalSettings\.customShells/);
  assert.match(utilsSource, /customShells\?\:/);
  assert.match(utilsSource, /customShells[\s\S]*\.filter[\s\S]*\.map/);
});

test("deleted custom shells fall back to the platform default anywhere they were selected", async () => {
  const [platformSource, utilsSource, localFieldsSource, terminalWorkspaceSource] = await Promise.all([
    readFile(new URL("../src/lib/platform.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/modules/workspace/connections/utils.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../src/modules/workspace/connections/connection-dialog/LocalConnectionFields.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../src/modules/workspace/connections/terminal/TerminalWorkspace.tsx", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(platformSource, /currentPlatform\(\) === "macos" \? "\/bin\/zsh" : "\/bin\/bash"/);
  assert.match(utilsSource, /export function resolveAvailableLocalShell/);
  assert.match(localFieldsSource, /resolveAvailableLocalShell\(\s*initialConnection\?\.localShell/);
  assert.match(terminalWorkspaceSource, /resolveAvailableLocalShell\(\s*connection\.localShell/);
});
