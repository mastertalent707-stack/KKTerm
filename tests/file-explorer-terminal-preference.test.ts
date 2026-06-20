import assert from "node:assert/strict";
import test from "node:test";

import {
  fileExplorerTerminalOptionsForPlatform,
  resolveFileExplorerTerminalOption,
} from "../src/modules/workspace/connections/sftp/fileExplorerTerminalOptions.ts";
import { elevatedLocalShellAction } from "../src/modules/workspace/connections/quickConnectMenuModel.ts";

const customShells = [
  { id: "git-bash", name: "Git Bash", commandLine: String.raw`C:\Program Files\Git\bin\bash.exe --login -i` },
];

test("Windows File Explorer terminal choices include normal/admin built-ins and normal custom shells", () => {
  const options = fileExplorerTerminalOptionsForPlatform(customShells, "windows");

  assert.deepEqual(
    options.map(({ shell, elevated }) => [shell, elevated]),
    [
      ["cmd.exe", false],
      ["cmd.exe", true],
      ["powershell.exe", false],
      ["powershell.exe", true],
      ["pwsh.exe", false],
      ["pwsh.exe", true],
      [customShells[0].commandLine, false],
    ],
  );
});

test("macOS and Linux File Explorer terminal choices use their platform default plus custom shells", () => {
  const mac = fileExplorerTerminalOptionsForPlatform(customShells, "macos");
  const linux = fileExplorerTerminalOptionsForPlatform(customShells, "linux");

  assert.deepEqual(mac.map((option) => option.shell), ["/bin/zsh", customShells[0].commandLine]);
  assert.deepEqual(linux.map((option) => option.shell), ["/bin/bash", customShells[0].commandLine]);
  assert.ok([...mac, ...linux].every((option) => !option.elevated));
});

test("removed custom shell preferences fall back to the platform default", () => {
  const options = fileExplorerTerminalOptionsForPlatform([], "windows");
  const resolved = resolveFileExplorerTerminalOption(
    { shell: "missing.exe", elevated: true },
    options,
  );

  assert.equal(resolved.shell, "powershell.exe");
  assert.equal(resolved.elevated, false);
});

test("prelabelled admin choices do not duplicate the Admin suffix in an elevated app", () => {
  const action = elevatedLocalShellAction({
    adminLabel: "Admin",
    isAppElevated: true,
    option: { label: "PowerShell (Admin)", value: "powershell.exe" },
  });

  assert.deepEqual(action, {
    mode: "embedded",
    name: "PowerShell (Admin)",
    shell: "powershell.exe",
  });
});
