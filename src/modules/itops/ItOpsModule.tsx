// IT Ops Module shell: header, three tabs (Host Groups, Batch Runs,
// Automations) and the content router. Host Groups (Phase 1) and Batch Runs
// (Phase 2) are backed by real commands; the Automations tab still renders the
// Phase 0 fixtures until Phase 3.

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { listen } from "@tauri-apps/api/event";
import { isTauriRuntime } from "../../lib/tauri";
import type { RunEvent } from "../../types";
import { ItIcon, type ItIconName } from "./icons";
import { HostGroupsTab } from "./HostGroupsTab";
import { BatchRunsTab } from "./BatchRunsTab";
import { BatchRunDialog } from "./BatchRunDialog";
import { AutomationsTab } from "./AutomationsTab";
import { useItOpsStore } from "./state";
import { AUTOMATIONS } from "./data";

type TabId = "groups" | "runs" | "autos";

const TABS: { id: TabId; labelKey: string; icon: ItIconName }[] = [
  { id: "groups", labelKey: "itops.tabs.groups", icon: "group" },
  { id: "runs", labelKey: "itops.tabs.runs", icon: "run" },
  { id: "autos", labelKey: "itops.tabs.autos", icon: "auto" },
];

const PRIMARY: Record<TabId, { labelKey: string; icon: ItIconName; size: number }> = {
  groups: { labelKey: "itops.actions.newHostGroup", icon: "plus", size: 15 },
  runs: { labelKey: "itops.actions.newBatchRun", icon: "run", size: 13 },
  autos: { labelKey: "itops.actions.newAutomation", icon: "plus", size: 15 },
};

export function ItOpsModule({ onOpenAssistant }: { onOpenAssistant?: () => void }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>("groups");
  const [batchDialogGroupId, setBatchDialogGroupId] = useState<string | null | undefined>(
    undefined,
  );
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  const hostGroupCount = useItOpsStore((state) => state.hostGroups.length);
  const loadHostGroups = useItOpsStore((state) => state.loadHostGroups);
  const requestNewHostGroup = useItOpsStore((state) => state.requestNewHostGroup);
  const loadRunHistory = useItOpsStore((state) => state.loadRunHistory);
  const applyRunEvent = useItOpsStore((state) => state.applyRunEvent);
  const activeRun = useItOpsStore((state) => state.activeRun);
  const newRunRequest = useItOpsStore((state) => state.newRunRequest);
  const pendingRunGroupId = useItOpsStore((state) => state.pendingRunGroupId);

  useEffect(() => {
    void loadHostGroups();
    void loadRunHistory();
  }, [loadHostGroups, loadRunHistory]);

  // Stream live Batch Run progress into the store.
  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    const unlisten = listen<RunEvent>("itops://run", (event) => applyRunEvent(event.payload));
    return () => {
      void unlisten.then((dispose) => dispose());
    };
  }, [applyRunEvent]);

  function openBatchRunDialog(groupId?: string | null) {
    setBatchDialogGroupId(groupId);
    setBatchDialogOpen(true);
  }

  // The "Run task" / "Re-run" affordances request a run; switch to the Batch
  // Runs tab and open the launcher preselected to that group.
  const seenNewRunRequest = useRef(newRunRequest);
  useEffect(() => {
    if (newRunRequest !== seenNewRunRequest.current) {
      seenNewRunRequest.current = newRunRequest;
      setTab("runs");
      openBatchRunDialog(pendingRunGroupId);
    }
  }, [newRunRequest, pendingRunGroupId]);

  const prim = PRIMARY[tab];
  const runningCount = activeRun
    ? activeRun.hosts.filter((host) => host.status === "running" || host.status === "pending")
        .length
    : 0;

  function handlePrimary() {
    if (tab === "groups") {
      requestNewHostGroup();
    } else if (tab === "runs") {
      openBatchRunDialog();
    }
    // Automation creation arrives with Phase 3.
  }

  return (
    <div className="it">
      {/* header */}
      <div className="it-head">
        <span className="it-head-tile">
          <ItIcon name="ops" size={20} sw={1.7} />
        </span>
        <div className="it-head-txt">
          <h1>{t("itops.title")}</h1>
          <p>{t("itops.subtitle")}</p>
        </div>
        <span className="it-head-sp" />
        <button
          type="button"
          className="it-icon-btn accent"
          title={t("itops.askAssistant")}
          aria-label={t("itops.askAssistant")}
          onClick={onOpenAssistant}
        >
          <ItIcon name="bot" size={17} />
        </button>
        <button type="button" className="it-btn primary" onClick={handlePrimary}>
          <span className="it-btn-ic">
            <ItIcon name={prim.icon} size={prim.size} />
          </span>
          {t(prim.labelKey)}
        </button>
      </div>

      {/* tabs */}
      <div className="it-tabs">
        {TABS.map((tabDef) => {
          const active = tabDef.id === tab;
          const badge =
            tabDef.id === "groups"
              ? hostGroupCount
              : tabDef.id === "autos"
                ? AUTOMATIONS.length
                : null;
          return (
            <button
              key={tabDef.id}
              type="button"
              className={`it-tab${active ? " active" : ""}`}
              onClick={() => setTab(tabDef.id)}
            >
              <span className="it-tab-ic">
                <ItIcon name={tabDef.icon} size={15} sw={1.7} />
              </span>
              {t(tabDef.labelKey)}
              {badge !== null ? <span className="it-tab-badge">{badge}</span> : null}
              {tabDef.id === "runs" && runningCount > 0 ? (
                <span className="it-tab-badge live">{runningCount}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* content */}
      <div className="it-content">
        {tab === "groups" ? <HostGroupsTab /> : null}
        {tab === "runs" ? <BatchRunsTab onNewBatchRun={() => openBatchRunDialog()} /> : null}
        {tab === "autos" ? <AutomationsTab empty={false} /> : null}
      </div>

      {batchDialogOpen ? (
        <BatchRunDialog
          defaultGroupId={batchDialogGroupId}
          onClose={() => setBatchDialogOpen(false)}
          onStarted={() => setTab("runs")}
        />
      ) : null}
    </div>
  );
}
