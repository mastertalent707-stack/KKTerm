export function SettingsSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="settings-summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export type PlannedSetting = {
  label: string;
  value: string;
  hint?: string;
};

export function PlannedSettingsGrid({ settings }: { settings: readonly PlannedSetting[] }) {
  return (
    <div className="settings-summary-grid">
      {settings.map((setting) => (
        <div className="settings-summary-item planned-setting" key={setting.label}>
          <span>{setting.label}</span>
          <strong>{setting.value}</strong>
          {setting.hint ? <small>{setting.hint}</small> : null}
        </div>
      ))}
    </div>
  );
}
