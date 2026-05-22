import { Check, ShieldAlert, X } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { PendingToolApproval, ToolApprovalAction } from "./assistantTypes";
import { humanizeAssistantToolName } from "./assistantToolLabels";

export function AssistantToolApprovalCards({
  approvals,
  onAllow,
  onAllowSession,
  onDeny,
}: {
  approvals: PendingToolApproval[];
  onAllow: (request: PendingToolApproval) => void;
  onAllowSession: (request: PendingToolApproval) => void;
  onDeny: (request: PendingToolApproval) => void;
}) {
  return (
    <>
      {approvals.map((request) => (
        <AssistantToolApprovalCard
          key={request.requestId}
          request={request}
          onAllow={() => onAllow(request)}
          onAllowSession={() => onAllowSession(request)}
          onDeny={() => onDeny(request)}
        />
      ))}
    </>
  );
}

function AssistantToolApprovalCard({
  onAllow,
  onAllowSession,
  onDeny,
  request,
}: {
  onAllow: () => void;
  onAllowSession: () => void;
  onDeny: () => void;
  request: PendingToolApproval;
}) {
  const { t } = useTranslation();
  const [selectedAction, setSelectedAction] = useState<ToolApprovalAction>("");
  const isPending = request.status === "pending";
  const argsPreview = formatToolApprovalArgs(request.args);
  const toolLabel = humanizeAssistantToolName(request.toolName);

  function handleApprovalActionChange(event: ChangeEvent<HTMLSelectElement>) {
    const action = event.currentTarget.value as ToolApprovalAction;
    setSelectedAction(action);
    if (action === "allow") {
      onAllow();
      return;
    }
    if (action === "allowSession") {
      onAllowSession();
      return;
    }
    if (action === "deny") {
      onDeny();
    }
  }

  if (!isPending) {
    return (
      <article className="assistant-message assistant">
        <div className="assistant-message-content">
          <section className="assistant-tool-approval-card assistant-tool-approval-summary" aria-live="polite">
            <span aria-hidden="true">
              {request.status === "denied" ? <X size={14} /> : <Check size={14} />}
            </span>
            <strong>{toolApprovalStatusLabel(request.status, t)}</strong>
            <small>{t("ai.toolApprovalTool", { tool: toolLabel })}</small>
          </section>
        </div>
      </article>
    );
  }

  return (
    <article className="assistant-message assistant">
      <div className="assistant-message-content">
        <section className="assistant-tool-approval-card" aria-live="polite">
          <header>
            <ShieldAlert size={15} />
            <div>
              <strong>{t("ai.toolApprovalTitle")}</strong>
              <small>
                {t("ai.toolApprovalTool", {
                  tool: toolLabel,
                })}
              </small>
            </div>
          </header>
          <p>{t("ai.toolApprovalBody")}</p>
          {argsPreview ? (
            <details>
              <summary>{t("ai.toolApprovalDetails")}</summary>
              <pre>
                <code>{argsPreview}</code>
              </pre>
            </details>
          ) : null}
          <footer>
            <span>{t("ai.toolApprovalWaiting")}</span>
            <label className="assistant-tool-approval-action">
              <select
                aria-label={t("ai.toolApprovalSelectAction")}
                disabled={!isPending}
                onChange={handleApprovalActionChange}
                value={selectedAction}
              >
                <option value="">{t("ai.toolApprovalSelectAction")}</option>
                <option value="allow">{t("ai.toolApprovalAllow")}</option>
                <option value="allowSession">{t("ai.toolApprovalAllowSession")}</option>
                <option value="deny">{t("ai.toolApprovalDeny")}</option>
              </select>
            </label>
          </footer>
        </section>
      </div>
    </article>
  );
}

function toolApprovalStatusLabel(
  status: PendingToolApproval["status"],
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (status === "allowedSession") {
    return t("ai.toolApprovalAllowedSession");
  }
  if (status === "approved") {
    return t("ai.toolApprovalApproved");
  }
  return t("ai.toolApprovalDenied");
}

function formatToolApprovalArgs(args: Record<string, unknown> | undefined) {
  if (!args || Object.keys(args).length === 0) {
    return "";
  }
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return "";
  }
}
