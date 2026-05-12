import { LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "../dashboard/state/dashboardStore";
import type { DashboardSettings as DashboardSettingsState } from "../types";
import { SettingsSectionHeader } from "./shared";

export function DashboardSettings({
  draft,
  onChange,
}: {
  draft: DashboardSettingsState;
  onChange: (next: DashboardSettingsState) => void;
}) {
  const { t } = useTranslation();
  const views = useDashboardStore((s) => s.views);

  return (
    <section className="settings-card settings-section">
      <SettingsSectionHeader
        icon={<LayoutDashboard size={18} />}
        label={t("settings.sectionDashboard")}
        title={t("settings.sectionDashboard")}
      />
      <fieldset className="settings-subsection settings-fieldset">
        <legend>{t("settings.dashboardGeneral")}</legend>
        <div className="form-grid">
          <label className="settings-toggle-row">
            <input
              type="checkbox"
              checked={draft.confirmRemove}
              onChange={(e) => onChange({ ...draft, confirmRemove: e.target.checked })}
            />
            <span>{t("settings.dashboardConfirmRemove")}</span>
          </label>
          <label>
            <span>{t("settings.dashboardDefaultLanding")}</span>
            <select
              value={draft.defaultLandingView}
              onChange={(e) => onChange({ ...draft, defaultLandingView: e.target.value })}
            >
              <option value="lastActive">{t("settings.dashboardLandingLast")}</option>
              {views.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>
    </section>
  );
}
