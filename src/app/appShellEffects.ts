import { useEffect, useLayoutEffect } from "react";
import type { RefObject } from "react";
import { invokeCommand, isTauriRuntime } from "../lib/tauri";
import { useWorkspaceStore } from "../store";
import type { AppearanceSettings } from "../types";
import type { PanelLayoutState } from "./workspaceChromeLayout";

export function useFrontendLaunchTimestamp() {
  const setFrontendLaunchMs = useWorkspaceStore((state) => state.setFrontendLaunchMs);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFrontendLaunchMs(Math.round(performance.now()));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [setFrontendLaunchMs]);
}

export function useDebugFrontendHeartbeat() {
  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }

    let disposed = false;
    let intervalId = 0;
    const sendHeartbeat = () => {
      void invokeCommand("debug_frontend_heartbeat").catch(() => undefined);
    };

    void invokeCommand("is_debug_build").then((debugBuild) => {
      if (disposed || !debugBuild) {
        return;
      }
      sendHeartbeat();
      intervalId = window.setInterval(sendHeartbeat, 2_000);
    });

    return () => {
      disposed = true;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);
}

export function useHostUsagePolling() {
  const statusBarMonitorEnabled = useWorkspaceStore(
    (state) => state.generalSettings.statusBarMonitorEnabled,
  );
  const statusBarMonitorIntervalSeconds = useWorkspaceStore(
    (state) => state.generalSettings.statusBarMonitorIntervalSeconds,
  );
  const setHostUsageSnapshot = useWorkspaceStore((state) => state.setHostUsageSnapshot);

  useEffect(() => {
    if (!isTauriRuntime() || !statusBarMonitorEnabled) {
      return;
    }

    let disposed = false;
    let refreshing = false;
    async function refreshHostUsageSnapshot() {
      if (refreshing) {
        return;
      }
      refreshing = true;
      try {
        const snapshot = await invokeCommand("get_host_usage_snapshot");
        if (!disposed) {
          setHostUsageSnapshot(snapshot);
        }
      } catch {
        // Host usage is informational only.
      } finally {
        refreshing = false;
      }
    }

    void refreshHostUsageSnapshot();
    const intervalMs = statusBarMonitorIntervalSeconds * 1_000;
    const interval = window.setInterval(() => void refreshHostUsageSnapshot(), intervalMs);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [setHostUsageSnapshot, statusBarMonitorEnabled, statusBarMonitorIntervalSeconds]);
}

export function useGlobalContextMenuSuppression() {
  useEffect(() => {
    const preventDefaultContextMenu = (event: globalThis.MouseEvent) => {
      if (isEditableContextMenuTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    window.addEventListener("contextmenu", preventDefaultContextMenu, { capture: true });
    return () => {
      window.removeEventListener("contextmenu", preventDefaultContextMenu, { capture: true });
    };
  }, []);
}

const TEXT_INPUT_TYPES = new Set([
  "",
  "email",
  "number",
  "password",
  "search",
  "tel",
  "text",
  "url",
]);

function isEditableContextMenuTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  const editable = target.closest("input, textarea, [contenteditable]");
  if (editable instanceof HTMLTextAreaElement) {
    return true;
  }
  if (editable instanceof HTMLInputElement) {
    return TEXT_INPUT_TYPES.has(editable.type);
  }
  if (editable instanceof HTMLElement) {
    return editable.isContentEditable;
  }
  return false;
}

export function useAppShellAppearance({
  aiPanelLayout,
  appShellRef,
  appearanceSettings,
  connectionPanelLayout,
}: {
  aiPanelLayout: PanelLayoutState;
  appShellRef: RefObject<HTMLDivElement | null>;
  appearanceSettings: AppearanceSettings;
  connectionPanelLayout: PanelLayoutState;
}) {
  useLayoutEffect(() => {
    const node = appShellRef.current;
    if (!node) {
      return;
    }

    node.style.setProperty(
      "--connection-panel-width",
      connectionPanelLayout.collapsed ? "0px" : `${connectionPanelLayout.width}px`,
    );
    node.style.setProperty("--connection-resize-width", "1px");
    node.style.setProperty("--ai-panel-width", aiPanelLayout.collapsed ? "0px" : `${aiPanelLayout.width}px`);
    node.style.setProperty("--ai-resize-width", aiPanelLayout.collapsed ? "34px" : "1px");
    node.style.setProperty("--app-ui-font-family", appearanceSettings.appFontFamily);
    node.setAttribute("data-color-scheme", appearanceSettings.colorScheme);
  }, [
    aiPanelLayout.collapsed,
    aiPanelLayout.width,
    appShellRef,
    appearanceSettings.appFontFamily,
    appearanceSettings.colorScheme,
    connectionPanelLayout.collapsed,
    connectionPanelLayout.width,
  ]);
}
