// Behavioral tests for the predicate that decides whether the "Use psmux
// session management" toggle is offered. psmux mirrors SSH tmux but is local and
// applies only to the PowerShell family of shells; every other shell hides the
// toggle. The install/availability flow needs the Tauri runtime and is verified
// manually — this isolates the pure decision.
import assert from "node:assert/strict";
import test from "node:test";

import { isPowerShellFamilyShell } from "../src/modules/workspace/connections/connection-dialog/psmuxShell.ts";

test("isPowerShellFamilyShell matches PowerShell and pwsh in any casing or path form", () => {
  assert.equal(isPowerShellFamilyShell("powershell.exe"), true);
  assert.equal(isPowerShellFamilyShell("PowerShell.exe"), true);
  assert.equal(isPowerShellFamilyShell("pwsh.exe"), true);
  assert.equal(isPowerShellFamilyShell("PWSH"), true);
  assert.equal(isPowerShellFamilyShell("C:\\Program Files\\PowerShell\\7\\pwsh.exe"), true);
});

test("isPowerShellFamilyShell rejects non-PowerShell shells", () => {
  assert.equal(isPowerShellFamilyShell("cmd.exe"), false);
  assert.equal(isPowerShellFamilyShell("wsl.exe"), false);
  assert.equal(isPowerShellFamilyShell("bash.exe"), false);
  assert.equal(isPowerShellFamilyShell(undefined), false);
});
