import i18next from "../../../../i18n/config";
import { confirmNativeDialog, invokeCommand, isTauriRuntime } from "../../../../lib/tauri";
import { installRecipeAndWait } from "../../../installer/progress";

export { isPowerShellFamilyShell } from "./psmuxShell";

const PSMUX_TOOL_ID = "psmux";
const PSMUX_PROGRAM = "psmux.exe";

/** Result of trying to make psmux available before enabling its toggle. */
export type PsmuxAvailability = "available" | "declined" | "failed";

/**
 * Ensure psmux is installed before turning the "Use psmux session management"
 * toggle on. Mirrors the PowerShell 7 pre-flight (`pwshPreflight.ts`): if psmux
 * is missing it prompts the user (translated native dialog) and, on accept,
 * installs the `psmux` Install Helper recipe, then re-checks availability.
 *
 * Outside the Tauri runtime (web preview / tests) there is no local shell to
 * probe, so the toggle is allowed to flip freely; the launch-time guard in the
 * backend still falls back to the plain shell when psmux is unavailable.
 */
export async function ensurePsmuxAvailable(): Promise<PsmuxAvailability> {
  if (!isTauriRuntime()) {
    return "available";
  }
  if (await invokeCommand("local_shell_available", { shell: PSMUX_PROGRAM })) {
    return "available";
  }

  const shouldInstall = await confirmNativeDialog(i18next.t("installer.psmux.installPrompt"), {
    title: i18next.t("installer.psmux.installTitle"),
  });
  if (shouldInstall !== true) {
    return "declined";
  }

  try {
    await invokeCommand("installer_load_catalog", {});
    const result = await installRecipeAndWait(PSMUX_TOOL_ID);
    if (
      result.kind === "completed" &&
      (await invokeCommand("local_shell_available", { shell: PSMUX_PROGRAM }))
    ) {
      return "available";
    }
    return "failed";
  } catch {
    return "failed";
  }
}
