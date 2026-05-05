import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";

export const SUPPORTED_LANGUAGES = [
  "en",
  "fr",
  "it",
  "de",
  "es",
  "es-MX",
  "pt-BR",
  "zh-TW",
  "zh-CN",
  "ja",
  "ko",
  "th",
  "id",
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "admindeck.language";

export function detectLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return "en";
  }
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) {
      return stored;
    }
  } catch {
    // Storage unavailable
  }
  return "en";
}

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}

export function persistLanguage(language: SupportedLanguage) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage may be unavailable
  }
}

i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: detectLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  returnEmptyString: false,
});

let resourcesLoaded = false;

export async function ensureI18nReady(): Promise<void> {
  if (resourcesLoaded) {
    return;
  }

  const language = detectLanguage();
  if (language === "en") {
    resourcesLoaded = true;
    return;
  }

  try {
    const module = await import(`./locales/${language}.json`);
    i18next.addResourceBundle(language, "translation", module.default ?? module, true, true);
  } catch {
    // Fall back to English silently
  }

  if (i18next.language !== language) {
    await i18next.changeLanguage(language);
    persistLanguage(language);
  }

  resourcesLoaded = true;
}

export async function switchLanguage(language: SupportedLanguage): Promise<void> {
  if (language === i18next.language) {
    return;
  }

  if (language !== "en" && !i18next.hasResourceBundle(language, "translation")) {
    try {
      const module = await import(`./locales/${language}.json`);
      i18next.addResourceBundle(language, "translation", module.default ?? module, true, true);
    } catch {
      // Fall back to English silently
    }
  }

  await i18next.changeLanguage(language);
  persistLanguage(language);
}

export default i18next;
