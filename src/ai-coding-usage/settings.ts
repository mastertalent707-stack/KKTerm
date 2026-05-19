import type { AiCodingUsageProvider } from "./types";

export const AI_CODING_USAGE_PROVIDER_ORDER: AiCodingUsageProvider[] = [
  "codex",
  "claudeCode",
];

export interface AiCodingUsageWidgetSettings {
  providers: AiCodingUsageProvider[];
}

const EMPTY_SETTINGS: AiCodingUsageWidgetSettings = {
  providers: [],
};

export function parseAiCodingUsageSettingsJson(
  value: string | null | undefined,
): AiCodingUsageWidgetSettings {
  if (!value?.trim()) {
    return { ...EMPTY_SETTINGS };
  }
  try {
    const parsed = JSON.parse(value) as { providers?: unknown };
    if (!Array.isArray(parsed.providers)) {
      return { ...EMPTY_SETTINGS };
    }
    return {
      providers: normalizeProviders(parsed.providers),
    };
  } catch {
    return { ...EMPTY_SETTINGS };
  }
}

export function serializeAiCodingUsageSettings(
  settings: AiCodingUsageWidgetSettings,
) {
  return JSON.stringify({
    providers: normalizeProviders(settings.providers),
  });
}

export function addAiCodingUsageProvider(
  settings: AiCodingUsageWidgetSettings,
  provider: AiCodingUsageProvider,
): AiCodingUsageWidgetSettings {
  return {
    providers: normalizeProviders([...settings.providers, provider]),
  };
}

export function removeAiCodingUsageProvider(
  settings: AiCodingUsageWidgetSettings,
  provider: AiCodingUsageProvider,
): AiCodingUsageWidgetSettings {
  return {
    providers: normalizeProviders(
      settings.providers.filter((candidate) => candidate !== provider),
    ),
  };
}

export function availableAiCodingUsageProviders(
  settings: AiCodingUsageWidgetSettings,
): AiCodingUsageProvider[] {
  const selected = new Set(settings.providers);
  return AI_CODING_USAGE_PROVIDER_ORDER.filter((provider) => !selected.has(provider));
}

function normalizeProviders(values: unknown[]): AiCodingUsageProvider[] {
  const providers = new Set<AiCodingUsageProvider>();
  for (const value of values) {
    if (value === "codex" || value === "claudeCode") {
      providers.add(value);
    }
  }
  return Array.from(providers);
}
