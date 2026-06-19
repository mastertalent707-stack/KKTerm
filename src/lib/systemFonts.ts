// System font enumeration + cache.
//
// The font picker in Settings can pull the OS-installed font families through
// the Rust backend (`list_system_fonts`), which scans the platform font
// directories cross-platform. The result is cached in localStorage so the long
// list survives an app relaunch; a refresh action re-queries and overwrites the
// cache.

import { invokeCommand, isTauriRuntime } from "./tauri";
import type { SystemFont } from "../types";

const SYSTEM_FONTS_STORAGE_KEY = "kkterm.systemFonts";

/** Whether the running build can enumerate OS fonts (desktop runtime only). */
export function isSystemFontAccessSupported(): boolean {
  return isTauriRuntime();
}

/** Family names from a system-font list, optionally restricted to monospace. */
export function systemFontFamilies(fonts: SystemFont[], monospaceOnly = false): string[] {
  return fonts.filter((font) => !monospaceOnly || font.isMonospace).map((font) => font.family);
}

/** Read the previously cached system fonts (empty when never refreshed). */
export function loadCachedSystemFonts(): SystemFont[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(SYSTEM_FONTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return normalizeSystemFonts(parsed);
  } catch {
    return [];
  }
}

/** Accept both the current object cache and the legacy `string[]` cache shape. */
function normalizeSystemFonts(values: unknown[]): SystemFont[] {
  const fonts: SystemFont[] = [];
  for (const value of values) {
    if (typeof value === "string") {
      const family = value.trim();
      if (family) fonts.push({ family, isMonospace: false });
    } else if (value && typeof value === "object" && "family" in value) {
      const family = String((value as { family: unknown }).family).trim();
      if (family) {
        fonts.push({ family, isMonospace: Boolean((value as { isMonospace?: unknown }).isMonospace) });
      }
    }
  }
  return fonts;
}

/**
 * Ask the backend for installed fonts, cache them, and return the sorted unique
 * list with monospace flags. Throws when the runtime cannot enumerate fonts so
 * callers can surface a localized notice.
 */
export async function refreshSystemFonts(): Promise<SystemFont[]> {
  if (!isTauriRuntime()) {
    throw new Error("System font access is not supported in this runtime.");
  }

  const fonts = await invokeCommand("list_system_fonts");
  const byFamily = new Map<string, boolean>();
  for (const font of fonts) {
    const family = font.family.trim();
    if (!family) continue;
    byFamily.set(family, (byFamily.get(family) ?? false) || font.isMonospace);
  }

  const list: SystemFont[] = [...byFamily.entries()]
    .map(([family, isMonospace]) => ({ family, isMonospace }))
    .sort((a, b) => a.family.localeCompare(b.family));
  try {
    localStorage.setItem(SYSTEM_FONTS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore quota/serialization failures: the in-memory list is still usable.
  }
  return list;
}

/**
 * Filter detected system fonts down to families not already represented by the
 * curated list or the user's dropped-in custom fonts. Matching is
 * case-insensitive on the family name so a curated entry hides its system twin.
 */
export function systemFontsExcluding(systemFonts: string[], exclude: Iterable<string>): string[] {
  const excluded = new Set<string>();
  for (const name of exclude) {
    const normalized = name.trim().toLowerCase();
    if (normalized) {
      excluded.add(normalized);
    }
  }
  return systemFonts.filter((font) => !excluded.has(font.trim().toLowerCase()));
}
