import { LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDashboardStore } from "../dashboard/state/dashboardStore";
import { SettingsSectionHeader } from "./shared";

// TODO: Persist via Tauri typed settings command once dashboard_get_settings /
// dashboard_update_settings commands are added to the backend. For now we use
// localStorage as a stop-gap.
const STORAGE_KEY = "kkterm.dashboard.settings";

export interface DashboardSettingsState {
  confirmRemove: boolean;
  defaultLandingView: string;
}

const DEFAULT_DRAFT: DashboardSettingsState = {
  confirmRemove: true,
  defaultLandingView: "lastActive",
};

export async function loadDashboardSettingsDraft(): Promise<DashboardSettingsState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DashboardSettingsState>;
      return {
        confirmRemove: parsed.confirmRemove ?? DEFAULT_DRAFT.confirmRemove,
        defaultLandingView: parsed.defaultLandingView ?? DEFAULT_DRAFT.defaultLandingView,
      };
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_DRAFT };
}

export async function saveDashboardSettingsDraft(draft: DashboardSettingsState): Promise<void> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

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
