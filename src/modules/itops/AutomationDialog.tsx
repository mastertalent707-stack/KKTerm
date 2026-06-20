// Create an Automation (docs/ITOPS.md Phase 3). Phase 3 exposes the common
// performance-counter rule — "metric crosses a threshold → notify" — which
// covers the headline case and arms a durable Watchdog that re-arms on launch.
// Richer triggers/actions (the full builder) follow in Phases 4–5.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Actions, Btn, DialogShell, Field, Select, Sheet, TextInput } from "../../app/ui/dialog";
import { useWorkspaceStore } from "../../store";
import type { PerformanceMetric, WatchdogConfig, WatchdogNotification } from "../../watchdog/types";
import { useItOpsStore } from "./state";

const METRICS: PerformanceMetric[] = [
  "cpuPercent",
  "ramPercent",
  "commitPercent",
  "diskFreePercent",
  "diskUsedPercent",
  "networkDownBytesPerSec",
  "networkUpBytesPerSec",
  "appWorkingSetBytes",
  "appPrivateBytes",
  "handleCount",
  "processCount",
  "threadCount",
];

type Op = "gt" | "lt" | "gte" | "lte";
const OPS: { value: Op; label: string }[] = [
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: "≥" },
  { value: "lte", label: "≤" },
];

const NOTIFICATIONS: WatchdogNotification[] = ["inAppOnly", "inAppPlusToast", "inAppPlusSound"];

export function AutomationDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const createAutomation = useItOpsStore((state) => state.createAutomation);
  const showStatusBarNotice = useWorkspaceStore((state) => state.showStatusBarNotice);

  const [name, setName] = useState("");
  const [metric, setMetric] = useState<PerformanceMetric>("diskUsedPercent");
  const [op, setOp] = useState<Op>("gt");
  const [threshold, setThreshold] = useState("85");
  const [pollSeconds, setPollSeconds] = useState("60");
  const [notification, setNotification] = useState<WatchdogNotification>("inAppPlusToast");
  const [busy, setBusy] = useState(false);

  const thresholdNum = Number(threshold);
  const pollNum = Number(pollSeconds);
  const canSave =
    name.trim().length > 0 &&
    Number.isFinite(thresholdNum) &&
    Number.isFinite(pollNum) &&
    pollNum >= 1 &&
    !busy;

  async function handleSave() {
    if (!canSave) {
      return;
    }
    setBusy(true);
    const config: WatchdogConfig = {
      name: name.trim(),
      target: { kind: "performanceCounter", metric },
      trigger: { predicate: { op, value: thresholdNum } },
      pollMs: Math.max(500, Math.round(pollNum * 1000)),
      stop: { kind: "untilCanceled" },
      notification,
      action: { kind: "notify" },
    };
    try {
      const saved = await createAutomation(name.trim(), config, true);
      showStatusBarNotice(t("itops.automations.savedNotice", { name: saved.name }), {
        tone: "success",
      });
      onSaved();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showStatusBarNotice(t("itops.errorNotice", { message }), { tone: "error" });
      setBusy(false);
    }
  }

  return (
    <DialogShell onBackdrop={onClose}>
      <Sheet
        width={560}
        title={t("itops.actions.newAutomation")}
        ariaLabel={t("itops.actions.newAutomation")}
        footer={
          <Actions
            cancel={<Btn onClick={onClose}>{t("itops.actions.cancel")}</Btn>}
            primary={
              <Btn kind="primary" onClick={() => void handleSave()} disabled={!canSave}>
                {t("itops.actions.create")}
              </Btn>
            }
          />
        }
      >
        <Field label={t("itops.automations.nameLabel")} req>
          <TextInput
            value={name}
            placeholder={t("itops.automations.namePlaceholder")}
            onChange={(event) => setName(event.currentTarget.value)}
            autoFocus
          />
        </Field>
        <Field label={t("itops.automations.metricLabel")} req>
          <Select
            value={metric}
            onChange={(event) => setMetric(event.currentTarget.value as PerformanceMetric)}
            options={METRICS.map((value) => ({ value, label: value }))}
          />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={t("itops.automations.conditionLabel")} req>
            <Select
              value={op}
              onChange={(event) => setOp(event.currentTarget.value as Op)}
              options={OPS}
            />
          </Field>
          <Field label={t("itops.automations.thresholdLabel")} req>
            <TextInput
              value={threshold}
              inputMode="decimal"
              onChange={(event) => setThreshold(event.currentTarget.value)}
            />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label={t("itops.automations.pollLabel")} req>
            <TextInput
              value={pollSeconds}
              inputMode="numeric"
              onChange={(event) => setPollSeconds(event.currentTarget.value)}
            />
          </Field>
          <Field label={t("itops.automations.notifyLabel")}>
            <Select
              value={notification}
              onChange={(event) => setNotification(event.currentTarget.value as WatchdogNotification)}
              options={NOTIFICATIONS.map((value) => ({
                value,
                label: t(`watchdog.detail.notification.${value}`),
              }))}
            />
          </Field>
        </div>
      </Sheet>
    </DialogShell>
  );
}
