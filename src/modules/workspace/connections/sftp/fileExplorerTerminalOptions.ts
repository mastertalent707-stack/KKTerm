import i18next from "../../../../i18n/config";
import { currentPlatform, type RuntimePlatform } from "../../../../lib/platform";
import type { TerminalCustomShell } from "../../../../types";

export interface FileExplorerTerminalOption {
  elevated: boolean;
  id: string;
  label: string;
  shell: string;
}

const WINDOWS_BUILT_INS = [
  { id: "command-prompt", labelKey: "settings.commandPrompt", shell: "cmd.exe" },
  { id: "powershell", labelKey: "settings.powerShell", shell: "powershell.exe" },
  { id: "powershell-7", labelKey: "settings.powerShell7", shell: "pwsh.exe" },
] as const;

export function fileExplorerTerminalOptionsForPlatform(
  customShells: TerminalCustomShell[],
  platform: RuntimePlatform = currentPlatform(),
): FileExplorerTerminalOption[] {
  const customOptions = customShells
    .filter((shell) => shell.name.trim() && shell.commandLine.trim())
    .map((shell) => ({
      elevated: false,
      id: `custom:${shell.id}`,
      label: shell.name.trim(),
      shell: shell.commandLine.trim(),
    }));

  if (platform === "windows" || platform === "unknown") {
    const adminLabel = i18next.t("connections.admin");
    return [
      ...WINDOWS_BUILT_INS.flatMap((option) => {
        const label = i18next.t(option.labelKey);
        return [
          { elevated: false, id: `builtin:${option.id}:normal`, label, shell: option.shell },
          {
            elevated: true,
            id: `builtin:${option.id}:admin`,
            label: `${label} (${adminLabel})`,
            shell: option.shell,
          },
        ];
      }),
      ...customOptions,
    ];
  }

  const shell = platform === "macos" ? "/bin/zsh" : "/bin/bash";
  const label = platform === "macos" ? "zsh" : "bash";
  return [
    { elevated: false, id: `builtin:${label}`, label, shell },
    ...customOptions,
  ];
}

export function resolveFileExplorerTerminalOption(
  preference: { elevated: boolean; shell: string },
  options: FileExplorerTerminalOption[],
): FileExplorerTerminalOption {
  return (
    options.find(
      (option) => option.shell === preference.shell.trim() && option.elevated === preference.elevated,
    ) ??
    options.find((option) => option.shell === "powershell.exe" && !option.elevated) ??
    options[0]
  );
}
