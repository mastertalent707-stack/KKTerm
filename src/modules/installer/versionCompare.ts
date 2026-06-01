export function isInstallerUpdateAvailable(
  latestVersion: string | null | undefined,
  installedVersion: string | null | undefined,
): boolean {
  if (!latestVersion || !installedVersion) return false;
  return compareInstallerVersions(latestVersion, installedVersion) > 0;
}

export function compareInstallerVersions(a: string, b: string): number {
  const aParts = splitVersion(a);
  const bParts = splitVersion(b);
  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i += 1) {
    const aPart = aParts[i];
    const bPart = bParts[i];
    if (aPart === undefined) {
      return isZeroVersionRemainder(bParts.slice(i)) ? 0 : -1;
    }
    if (bPart === undefined) {
      return isZeroVersionRemainder(aParts.slice(i)) ? 0 : 1;
    }

    const partOrdering = compareVersionPart(aPart, bPart);
    if (partOrdering !== 0) return partOrdering;
  }

  return 0;
}

function splitVersion(version: string): string[] {
  return version.trim().split(/[.\-_+]/).filter(Boolean);
}

function compareVersionPart(a: string, b: string): number {
  const aNumber = parseIntegerPart(a);
  const bNumber = parseIntegerPart(b);
  if (aNumber !== null && bNumber !== null) {
    return Math.sign(aNumber - bNumber);
  }
  return a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase());
}

function parseIntegerPart(part: string): number | null {
  return /^\d+$/.test(part) ? Number.parseInt(part, 10) : null;
}

function isZeroVersionRemainder(parts: string[]): boolean {
  return parts.every((part) => parseIntegerPart(part) === 0);
}
