import { Bot, Code2, LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { invokeCommand, isTauriRuntime } from "../lib/tauri";
import type {
  AiCodingUsageProvider,
  AiCodingUsageProviderState,
  AiCodingUsageQuotaWindow,
  AiCodingUsageState,
} from "./types";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const PROVIDER_ORDER: AiCodingUsageProvider[] = ["codex", "claudeCode"];

const EMPTY_STATE: AiCodingUsageState = {
  providers: PROVIDER_ORDER.map((provider) => ({
    provider,
    authState: "disconnected",
    accountLabel: null,
    accountEmail: null,
    fiveHour: {},
    weekly: {},
    lastRefreshAt: null,
    lastError: null,
  })),
};

export function AiCodingUsageWidget({ instanceId }: { instanceId: string }) {
  const { t } = useTranslation();
  const [state, setState] = useState<AiCodingUsageState>(EMPTY_STATE);
  const [busyProvider, setBusyProvider] = useState<AiCodingUsageProvider | "all" | null>(null);
  const [loadError, setLoadError] = useState("");

  const connectedProviders = useMemo(
    () => state.providers.filter((provider) => provider.authState === "connected"),
    [state.providers],
  );

  const load = useCallback(async () => {
    if (!isTauriRuntime()) {
      return;
    }
    try {
      setState(await invokeCommand("ai_coding_usage_load"));
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!isTauriRuntime() || connectedProviders.length === 0 || busyProvider) {
      return;
    }
    setBusyProvider("all");
    try {
      let nextState = state;
      for (const provider of connectedProviders) {
        nextState = await invokeCommand("ai_coding_usage_refresh", {
          provider: provider.provider,
        });
      }
      setState(nextState);
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setBusyProvider(null);
    }
  }, [busyProvider, connectedProviders, state]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (connectedProviders.length === 0) {
      return;
    }
    const id = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [connectedProviders.length, refresh]);

  async function connectProvider(provider: AiCodingUsageProvider) {
    if (!isTauriRuntime() || busyProvider) {
      return;
    }
    setBusyProvider(provider);
    try {
      const nextProvider = await invokeCommand("ai_coding_usage_connect", { provider });
      setState((current) => replaceProvider(current, nextProvider));
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
      await load();
    } finally {
      setBusyProvider(null);
    }
  }

  async function disconnectProvider(provider: AiCodingUsageProvider) {
    if (!isTauriRuntime() || busyProvider) {
      return;
    }
    setBusyProvider(provider);
    try {
      const nextProvider = await invokeCommand("ai_coding_usage_disconnect", { provider });
      setState((current) => replaceProvider(current, nextProvider));
      setLoadError("");
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setBusyProvider(null);
    }
  }

  return (
    <div className="ai-coding-usage" data-instance-id={instanceId}>
      <div className="ai-coding-usage-toolbar">
        <div>
          <div className="ai-coding-usage-title">{t("dashboard.aiCodingUsageTitle")}</div>
          <div className="ai-coding-usage-subtitle">{t("dashboard.aiCodingUsageSubtitle")}</div>
        </div>
        <button
          type="button"
          className="dashboard-widget-icon-button ai-coding-usage-refresh"
          onClick={() => void refresh()}
          disabled={busyProvider !== null || connectedProviders.length === 0}
          aria-label={t("dashboard.aiCodingUsageRefreshNow")}
          title={t("dashboard.aiCodingUsageRefreshNow")}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="ai-coding-usage-providers">
        {PROVIDER_ORDER.map((provider) => {
          const providerState =
            state.providers.find((candidate) => candidate.provider === provider) ??
            EMPTY_STATE.providers.find((candidate) => candidate.provider === provider)!;
          return (
            <ProviderSlot
              busy={busyProvider === provider || busyProvider === "all"}
              key={provider}
              onConnect={() => void connectProvider(provider)}
              onDisconnect={() => void disconnectProvider(provider)}
              provider={providerState}
            />
          );
        })}
      </div>

      {loadError ? (
        <div className="ai-coding-usage-error" role="status">
          {t("dashboard.aiCodingUsageRefreshError", { message: loadError })}
        </div>
      ) : null}
    </div>
  );
}

function ProviderSlot({
  busy,
  onConnect,
  onDisconnect,
  provider,
}: {
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  provider: AiCodingUsageProviderState;
}) {
  const { t } = useTranslation();
  const label = t(`dashboard.aiCodingUsageProvider.${provider.provider}`);
  const connected = provider.authState === "connected";
  const Icon = provider.provider === "codex" ? Code2 : Bot;

  return (
    <section className="ai-coding-provider" data-state={provider.authState}>
      <div className="ai-coding-provider-header">
        <div className="ai-coding-provider-identity">
          <span className="ai-coding-provider-icon" aria-hidden="true">
            <Icon size={15} />
          </span>
          <span>
            <span className="ai-coding-provider-name">{label}</span>
            <span className="ai-coding-provider-account">
              {provider.accountLabel || provider.accountEmail || t("dashboard.aiCodingUsageNotConnected")}
            </span>
          </span>
        </div>
        {connected ? (
          <button
            type="button"
            className="dashboard-widget-icon-button"
            onClick={onDisconnect}
            disabled={busy}
            aria-label={t("dashboard.aiCodingUsageDisconnectProvider", { provider: label })}
            title={t("dashboard.aiCodingUsageDisconnectProvider", { provider: label })}
          >
            <LogOut size={13} />
          </button>
        ) : (
          <button
            type="button"
            className="ai-coding-connect"
            onClick={onConnect}
            disabled={busy}
          >
            {busy
              ? t("dashboard.aiCodingUsageConnecting")
              : t("dashboard.aiCodingUsageConnectProvider", { provider: label })}
          </button>
        )}
      </div>

      {connected ? (
        <>
          <UsageMeter
            label={t("dashboard.aiCodingUsageFiveHour")}
            quota={provider.fiveHour}
          />
          <UsageMeter
            label={t("dashboard.aiCodingUsageWeekly")}
            quota={provider.weekly}
          />
          <div className="ai-coding-provider-meta">
            {provider.lastRefreshAt
              ? t("dashboard.aiCodingUsageLastRefresh", {
                  time: formatDateTime(provider.lastRefreshAt),
                })
              : t("dashboard.aiCodingUsageNeverRefreshed")}
          </div>
        </>
      ) : (
        <div className="ai-coding-provider-empty">
          {provider.lastError
            ? t("dashboard.aiCodingUsageProviderError", { message: provider.lastError })
            : t("dashboard.aiCodingUsageProviderHint")}
        </div>
      )}

      {connected && provider.lastError ? (
        <div className="ai-coding-provider-warning">
          {t("dashboard.aiCodingUsageProviderError", { message: provider.lastError })}
        </div>
      ) : null}
    </section>
  );
}

function UsageMeter({ label, quota }: { label: string; quota: AiCodingUsageQuotaWindow }) {
  const { t } = useTranslation();
  const percent = typeof quota.usedPercent === "number" ? clamp(quota.usedPercent, 0, 100) : null;
  const meterState = percent === null ? "unknown" : percent >= 95 ? "danger" : percent >= 80 ? "warning" : "normal";

  return (
    <div className="ai-coding-meter" data-state={meterState}>
      <div className="ai-coding-meter-row">
        <span>{label}</span>
        <span>
          {percent === null
            ? t("dashboard.aiCodingUsageUnknownUsage")
            : t("dashboard.aiCodingUsagePercent", { percent: Math.round(percent) })}
        </span>
      </div>
      <div className="ai-coding-meter-track" aria-hidden="true">
        <MeterFill percent={percent ?? 0} />
      </div>
      <div className="ai-coding-meter-reset">
        {quota.resetsAt
          ? t("dashboard.aiCodingUsageResetsAt", { time: formatDateTime(quota.resetsAt) })
          : t("dashboard.aiCodingUsageResetUnknown")}
      </div>
    </div>
  );
}

function MeterFill({ percent }: { percent: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.width = `${clamp(percent, 0, 100)}%`;
    }
  }, [percent]);
  return <span ref={ref} />;
}

function replaceProvider(
  current: AiCodingUsageState,
  provider: AiCodingUsageProviderState,
): AiCodingUsageState {
  return {
    providers: PROVIDER_ORDER.map((id) =>
      id === provider.provider
        ? provider
        : current.providers.find((candidate) => candidate.provider === id) ??
          EMPTY_STATE.providers.find((candidate) => candidate.provider === id)!,
    ),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(date);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
