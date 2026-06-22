const LEGACY_URL_CREDENTIAL_PAGE_KEY = "__legacy__";
const FNV_OFFSET = 0xcbf29ce484222325n;
const FNV_PRIME = 0x100000001b3n;
const FNV_MASK = 0xffffffffffffffffn;

export function normalizeUrlCredentialPageKey(pageUrl?: string | null): string {
  const trimmed = pageUrl?.trim() ?? "";
  if (!trimmed) {
    return LEGACY_URL_CREDENTIAL_PAGE_KEY;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      parsed.username = "";
      parsed.password = "";
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    }
  } catch {
    // Fall through to a conservative string key for malformed or nonstandard URLs.
  }

  return trimmed.split("#", 1)[0]?.split("?", 1)[0]?.trim() || LEGACY_URL_CREDENTIAL_PAGE_KEY;
}

export function urlCredentialSecretOwnerId(connectionId: string, pageUrl?: string | null): string {
  const normalizedConnectionId = connectionId.trim();
  const pageKey = normalizeUrlCredentialPageKey(pageUrl);
  if (pageKey === LEGACY_URL_CREDENTIAL_PAGE_KEY) {
    return normalizedConnectionId;
  }
  return `url:${normalizedConnectionId}:${fnv1a64Hex(pageKey)}`;
}

function fnv1a64Hex(value: string): string {
  let hash = FNV_OFFSET;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = (hash * FNV_PRIME) & FNV_MASK;
  }
  return hash.toString(16).padStart(16, "0");
}
