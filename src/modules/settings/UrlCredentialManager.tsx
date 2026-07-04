import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Actions,
  Btn,
  DialogShell,
  Field,
  Sheet,
  TextInput,
} from "../../app/ui/dialog";
import { invokeCommand } from "../../lib/tauri";
import { useWorkspaceStore } from "../../store";
import type { UrlCredentialSummary } from "../../types";
import { CredentialDeleteConfirmDialog } from "./CredentialDeleteConfirmDialog";

type SavedInputField =
  | {
      selector: string;
      index: number;
      kind: "value";
      value: string;
    }
  | {
      selector: string;
      index: number;
      kind: "checked";
      checked: boolean;
    };

interface UrlCredentialEditDraft {
  username: string;
  password: string;
  fields: SavedInputField[];
}

function parseSavedInputFields(value?: string): SavedInputField[] {
  if (!value) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((field): SavedInputField[] => {
      if (!field || typeof field !== "object") {
        return [];
      }
      const candidate = field as Record<string, unknown>;
      if (typeof candidate.selector !== "string") {
        return [];
      }
      const index = typeof candidate.index === "number" ? candidate.index : 0;
      if (candidate.kind === "checked") {
        return [{ selector: candidate.selector, index, kind: "checked", checked: Boolean(candidate.checked) }];
      }
      if (candidate.kind === "value") {
        return [{ selector: candidate.selector, index, kind: "value", value: String(candidate.value ?? "") }];
      }
      return [];
    });
  } catch {
    return [];
  }
}

function draftFromCredential(credential: UrlCredentialSummary): UrlCredentialEditDraft {
  return {
    username: credential.username,
    password: "",
    fields: parseSavedInputFields(credential.fieldValues),
  };
}

function serializeSavedInputFields(
  credential: UrlCredentialSummary,
  draft: UrlCredentialEditDraft,
) {
  const fields = draft.fields.map((field) =>
    field.kind === "value" && field.selector === credential.usernameSelector
      ? { ...field, value: draft.username }
      : field,
  );
  return fields.length > 0 ? JSON.stringify(fields) : undefined;
}

function savedInputLabel(selector: string) {
  const attribute = selector.match(
    /\[(?:aria-label|placeholder|name|id)=(?:"([^"]+)"|'([^']+)'|([^\]]+))\]/i,
  );
  return attribute?.[1] ?? attribute?.[2] ?? attribute?.[3] ?? selector;
}

export function UrlCredentialManager({
  credentials,
  onChanged,
}: {
  credentials: UrlCredentialSummary[];
  onChanged: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const showStatusBarNotice = useWorkspaceStore((state) => state.showStatusBarNotice);
  const [editTarget, setEditTarget] = useState<UrlCredentialSummary | null>(null);
  const [editDraft, setEditDraft] = useState<UrlCredentialEditDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UrlCredentialSummary | null>(null);
  const [saving, setSaving] = useState(false);

  function beginEdit(credential: UrlCredentialSummary) {
    setEditTarget(credential);
    setEditDraft(draftFromCredential(credential));
  }

  function closeEditor() {
    if (saving) {
      return;
    }
    setEditTarget(null);
    setEditDraft(null);
  }

  async function saveEdit() {
    if (!editTarget || !editDraft || !editDraft.username.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (editDraft.password) {
        await invokeCommand("store_secret", {
          request: {
            kind: "urlPassword",
            ownerId: editTarget.secretOwnerId,
            secret: editDraft.password,
          },
        });
      }
      await invokeCommand("upsert_url_credential", {
        request: {
          connectionId: editTarget.connectionId,
          username: editDraft.username.trim(),
          pageUrl: editTarget.pageUrl,
          usernameSelector: editTarget.usernameSelector,
          passwordSelector: editTarget.passwordSelector,
          fieldValues: serializeSavedInputFields(editTarget, editDraft),
        },
      });
      setEditTarget(null);
      setEditDraft(null);
      window.dispatchEvent(new CustomEvent("kkterm:connection-tree-invalidated"));
      await onChanged();
      showStatusBarNotice(t("settings.urlPasswordUpdated"), { tone: "success" });
    } catch (error) {
      showStatusBarNotice(error instanceof Error ? error.message : String(error), { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCredential(credential: UrlCredentialSummary) {
    try {
      await invokeCommand("delete_stored_credential", {
        request: {
          kind: "urlPassword",
          ownerId: credential.secretOwnerId,
        },
      });
      window.dispatchEvent(new CustomEvent("kkterm:connection-tree-invalidated"));
      await onChanged();
      showStatusBarNotice(t("settings.urlPasswordDeleted"), { tone: "success" });
    } catch (error) {
      showStatusBarNotice(error instanceof Error ? error.message : String(error), { tone: "error" });
    }
  }

  return (
    <>
      {credentials.length === 0 ? (
        <p className="settings-empty-state">{t("settings.noSavedWebsitePasswords")}</p>
      ) : (
        <div className="settings-list" aria-label={t("settings.savedWebsitePasswords")}>
          {credentials.map((credential) => {
            const address = credential.pageUrl ?? credential.url ?? t("settings.notSet");
            return (
              <div
                className="settings-url-credential-row"
                key={credential.secretOwnerId}
              >
                <strong title={credential.connectionName}>{credential.connectionName}</strong>
                <span className="settings-url-credential-address" title={address}>{address}</span>
                <div className="settings-url-credential-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => beginEdit(credential)}
                  >
                    <Pencil size={15} />
                    {t("common.edit")}
                  </button>
                  <button
                    aria-label={t("settings.deleteCredential")}
                    className="settings-icon-danger-button"
                    type="button"
                    onClick={() => setDeleteTarget(credential)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editTarget && editDraft ? (
        <DialogShell>
          <Sheet
            title={t("settings.savedWebsitePasswords")}
            width={500}
            footer={
              <Actions
                primary={
                  <Btn
                    disabled={saving || !editDraft.username.trim()}
                    icon="check"
                    kind="primary"
                    onClick={() => void saveEdit()}
                  >
                    {t("common.save")}
                  </Btn>
                }
                cancel={
                  <Btn disabled={saving} onClick={closeEditor}>
                    {t("common.cancel")}
                  </Btn>
                }
              />
            }
          >
            <div className="settings-url-credential-context">
              <strong>{editTarget.connectionName}</strong>
              <span title={editTarget.pageUrl ?? editTarget.url}>
                {editTarget.pageUrl ?? editTarget.url ?? t("settings.notSet")}
              </span>
            </div>
            <div className="settings-url-credential-editor-grid">
              <Field label={t("settings.urlCredentialUsername")} req>
                <TextInput
                  autoFocus
                  autoComplete="username"
                  disabled={saving}
                  value={editDraft.username}
                  onChange={(event) =>
                    setEditDraft((current) => current ? { ...current, username: event.currentTarget.value } : current)
                  }
                />
              </Field>
              <Field
                hint={t("settings.urlCredentialPasswordPlaceholder")}
                label={t("settings.urlCredentialPassword")}
              >
                <TextInput
                  autoComplete="new-password"
                  disabled={saving}
                  type="password"
                  value={editDraft.password}
                  onChange={(event) =>
                    setEditDraft((current) => current ? { ...current, password: event.currentTarget.value } : current)
                  }
                />
              </Field>
            </div>
            {editDraft.fields.some((field) => field.selector !== editTarget.usernameSelector) ? (
              <div className="settings-url-saved-fields">
                {editDraft.fields
                  .map((field, fieldIndex) => ({ field, fieldIndex }))
                  .filter(({ field }) => field.selector !== editTarget.usernameSelector)
                  .map(({ field, fieldIndex }) => (
                    <label
                      className="settings-url-saved-field"
                      key={`${field.selector}:${field.index}:${fieldIndex}`}
                    >
                      <span title={field.selector}>{savedInputLabel(field.selector)}</span>
                      {field.kind === "checked" ? (
                        <input
                          aria-label={field.selector}
                          checked={field.checked}
                          disabled={saving}
                          type="checkbox"
                          onChange={(event) => {
                            const checked = event.currentTarget.checked;
                            setEditDraft((current) => current ? {
                              ...current,
                              fields: current.fields.map((candidate, index) =>
                                index === fieldIndex && candidate.kind === "checked"
                                  ? { ...candidate, checked }
                                  : candidate,
                              ),
                            } : current);
                          }}
                        />
                      ) : (
                        <TextInput
                          aria-label={field.selector}
                          disabled={saving}
                          value={field.value}
                          onChange={(event) => {
                            const value = event.currentTarget.value;
                            setEditDraft((current) => current ? {
                              ...current,
                              fields: current.fields.map((candidate, index) =>
                                index === fieldIndex && candidate.kind === "value"
                                  ? { ...candidate, value }
                                  : candidate,
                              ),
                            } : current);
                          }}
                        />
                      )}
                    </label>
                  ))}
              </div>
            ) : null}
          </Sheet>
        </DialogShell>
      ) : null}

      {deleteTarget ? (
        <CredentialDeleteConfirmDialog
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            const credential = deleteTarget;
            setDeleteTarget(null);
            void deleteCredential(credential);
          }}
        />
      ) : null}
    </>
  );
}
