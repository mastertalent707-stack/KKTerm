// Pure predicate (no Tauri/i18n imports) so it is unit-testable in the node test
// runner and reusable by both the dialog toggle and the psmux pre-flight.

/**
 * True when `value` names a PowerShell-family shell (Windows PowerShell or
 * PowerShell 7 / pwsh), in any casing or path form. psmux session management is
 * offered only for these shells.
 */
export function isPowerShellFamilyShell(value: string | undefined): boolean {
  const normalized = (value ?? "").toLowerCase();
  return normalized.includes("powershell") || normalized.includes("pwsh");
}
