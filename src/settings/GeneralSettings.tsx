import { useState } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, switchLanguage, detectLanguage, type SupportedLanguage } from "../i18n/config";

export function GeneralSettings() {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(detectLanguage);

  return (
    <section className="settings-card settings-section">
      <div className="settings-section-header">
        <div>
          <p className="panel-label">{t("settings.sectionGeneral")}</p>
          <h2>{t("settings.generalDefaults")}</h2>
        </div>
      </div>

      <div className="form-grid">
        <label>
          <span><Languages size={17} /> {t("settings.language")}</span>
          <select
            value={currentLanguage}
            onChange={(event) => {
              const lang = event.currentTarget.value as SupportedLanguage;
              setCurrentLanguage(lang);
              void switchLanguage(lang);
            }}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {t(`languages.${lang}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
