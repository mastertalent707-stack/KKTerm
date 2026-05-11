import {
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Shield,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode, RefObject } from "react";
import { useTranslation } from "react-i18next";
import { selectAppLauncherFile, isTauriRuntime } from "../lib/tauri";
import { useWorkspaceStore } from "../store";
import type {
  AppLauncherEntry,
  AppLauncherLaunchMode,
  AppLauncherSettings,
  PreparedAppLauncherEntry,
} from "../types";
import {
  isRunnablePath,
  launchAppLauncherEntry,
  loadAppLauncherSettings,
  prepareAppLauncherEntry,
  saveAppLauncherSettings,
} from "./storage";

type EntryDraft = {
  id: string;
  name: string;
  path: string;
  arguments: string;
  workingDirectory: string;
  iconDataUrl: string;
  railPinned: boolean;
  createdAt: string;
};

type MenuState = {
  entry: AppLauncherEntry;
  prepared?: PreparedAppLauncherEntry;
  x: number;
  y: number;
};

export function AppLauncherPage() {
  const { t } = useTranslation();
  const showStatusBarNotice = useWorkspaceStore((state) => state.showStatusBarNotice);
  const [settings, setSettings] = useState<AppLauncherSettings>({ entries: [] });
  const [preparedById, setPreparedById] = useState<Record<string, PreparedAppLauncherEntry>>({});
  const [dialogDraft, setDialogDraft] = useState<EntryDraft | null>(null);
  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let disposed = false;
    void loadAppLauncherSettings()
      .then((nextSettings) => {
        if (!disposed) {
          setSettings(nextSettings);
        }
      })
      .catch((error) => {
        if (!disposed) {
          showStatusBarNotice(
            t("appLauncher.loadError", { message: errorMessage(error) }),
            { tone: "error" },
          );
        }
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false);
        }
      });
    return () => {
      disposed = true;
    };
  }, [showStatusBarNotice, t]);

  useEffect(() => {
    let disposed = false;
    async function refreshEntries() {
      const pairs = await Promise.all(
        settings.entries.map(async (entry) => {
          try {
            return [entry.id, await prepareAppLauncherEntry(entry.path)] as const;
          } catch {
            return [
              entry.id,
              {
                name: entry.name,
                path: entry.path,
                exists: false,
                runnable: isRunnablePath(entry.path),
                iconDataUrl: entry.iconDataUrl ?? null,
              },
            ] as const;
          }
        }),
      );
      if (!disposed) {
        setPreparedById(Object.fromEntries(pairs));
      }
    }
    void refreshEntries();
    return () => {
      disposed = true;
    };
  }, [settings.entries]);

  useEffect(() => {
    if (!menuState) {
      return;
    }
    function closeMenu(event: PointerEvent) {
      const target = event.target as Node | null;
      if (target && menuRef.current?.contains(target)) {
        return;
      }
      setMenuState(null);
    }
    function closeMenuOnKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuState(null);
      }
    }
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeMenuOnKey);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeMenuOnKey);
    };
  }, [menuState]);

  useLayoutEffect(() => {
    const node = menuRef.current;
    if (!node || !menuState) {
      return;
    }
    const bounds = node.getBoundingClientRect();
    node.style.left = `${Math.max(8, Math.min(menuState.x, window.innerWidth - bounds.width - 8))}px`;
    node.style.top = `${Math.max(8, Math.min(menuState.y, window.innerHeight - bounds.height - 8))}px`;
  }, [menuState]);

  const railPinnedCount = useMemo(
    () => settings.entries.filter((entry) => entry.railPinned).length,
    [settings.entries],
  );

  async function addEntry() {
    let selectedPath: string | null = null;
    if (isTauriRuntime()) {
      selectedPath = await selectAppLauncherFile({
        filterName: t("appLauncher.fileFilter"),
        title: t("appLauncher.selectFileTitle"),
      });
      if (!selectedPath) {
        return;
      }
    }

    const prepared = selectedPath ? await prepareAppLauncherEntry(selectedPath) : undefined;
    const now = new Date().toISOString();
    setDialogDraft({
      id: `app-launcher-${Date.now()}`,
      name: prepared?.name ?? "",
      path: prepared?.path ?? "",
      arguments: "",
      workingDirectory: "",
      iconDataUrl: prepared?.iconDataUrl ?? "",
      railPinned: false,
      createdAt: now,
    });
  }

  function editEntry(entry: AppLauncherEntry) {
    setDialogDraft({
      id: entry.id,
      name: entry.name,
      path: entry.path,
      arguments: entry.arguments ?? "",
      workingDirectory: entry.workingDirectory ?? "",
      iconDataUrl: entry.iconDataUrl ?? "",
      railPinned: entry.railPinned,
      createdAt: entry.createdAt,
    });
  }

  async function saveDraft(draft: EntryDraft) {
    const now = new Date().toISOString();
    const nextEntry: AppLauncherEntry = {
      id: draft.id,
      name: draft.name.trim(),
      path: draft.path.trim(),
      arguments: optionalText(draft.arguments),
      workingDirectory: optionalText(draft.workingDirectory),
      iconDataUrl: optionalText(draft.iconDataUrl),
      railPinned: draft.railPinned,
      createdAt: draft.createdAt,
      updatedAt: now,
    };
    const exists = settings.entries.some((entry) => entry.id === draft.id);
    const nextSettings = {
      entries: exists
        ? settings.entries.map((entry) => (entry.id === draft.id ? nextEntry : entry))
        : [...settings.entries, nextEntry],
    };
    try {
      const saved = await saveAppLauncherSettings(nextSettings);
      setSettings(saved);
      setDialogDraft(null);
      showStatusBarNotice(t("appLauncher.savedStatus", { name: nextEntry.name }), {
        tone: "success",
      });
    } catch (error) {
      showStatusBarNotice(
        t("appLauncher.saveError", { message: errorMessage(error) }),
        { tone: "error" },
      );
    }
  }

  async function removeEntry(entry: AppLauncherEntry) {
    try {
      const saved = await saveAppLauncherSettings({
        entries: settings.entries.filter((candidate) => candidate.id !== entry.id),
      });
      setSettings(saved);
      showStatusBarNotice(t("appLauncher.removedStatus", { name: entry.name }), {
        tone: "info",
      });
    } catch (error) {
      showStatusBarNotice(
        t("appLauncher.saveError", { message: errorMessage(error) }),
        { tone: "error" },
      );
    }
  }

  async function launch(entry: AppLauncherEntry, mode: AppLauncherLaunchMode) {
    try {
      await launchAppLauncherEntry(entry, mode);
      showStatusBarNotice(t("appLauncher.launchStatus", { name: entry.name }), {
        tone: "success",
      });
    } catch (error) {
      showStatusBarNotice(
        t("appLauncher.launchError", { message: errorMessage(error) }),
        { tone: "error" },
      );
    }
  }

  return (
    <main className="app-launcher-page" aria-labelledby="app-launcher-title">
      <header className="app-launcher-header">
        <div>
          <p className="panel-label">{t("appLauncher.moduleLabel")}</p>
          <h1 id="app-launcher-title">{t("appLauncher.title")}</h1>
          <p>{t("appLauncher.subtitle")}</p>
        </div>
        <button className="primary-button app-launcher-add" onClick={() => void addEntry()} type="button">
          <Plus size={15} />
          {t("appLauncher.addApp")}
        </button>
      </header>
      <section className="app-launcher-summary" aria-label={t("appLauncher.summaryLabel")}>
        <div>
          <strong>{settings.entries.length}</strong>
          <span>{t("appLauncher.pinnedApps")}</span>
        </div>
        <div>
          <strong>{railPinnedCount}</strong>
          <span>{t("appLauncher.railShortcuts")}</span>
        </div>
      </section>
      {settings.entries.length > 0 ? (
        <section className="app-launcher-grid" aria-label={t("appLauncher.entriesLabel")}>
          {settings.entries.map((entry) => (
            <AppLauncherCard
              entry={entry}
              key={entry.id}
              onEdit={editEntry}
              onLaunch={launch}
              onMenu={(nextMenu) => setMenuState(nextMenu)}
              onRemove={removeEntry}
              prepared={preparedById[entry.id]}
            />
          ))}
        </section>
      ) : (
        <section className="app-launcher-empty">
          <Plus size={26} />
          <h2>{loading ? t("appLauncher.loading") : t("appLauncher.emptyTitle")}</h2>
          <p>{t("appLauncher.emptyHint")}</p>
        </section>
      )}
      {dialogDraft ? (
        <AppLauncherDialog
          draft={dialogDraft}
          onClose={() => setDialogDraft(null)}
          onSave={saveDraft}
          onUpdate={setDialogDraft}
        />
      ) : null}
      {menuState ? (
        <AppLauncherMenu
          menuRef={menuRef}
          onClose={() => setMenuState(null)}
          onEdit={editEntry}
          onLaunch={launch}
          onRemove={removeEntry}
          state={menuState}
        />
      ) : null}
    </main>
  );
}

function AppLauncherCard({
  entry,
  onEdit,
  onLaunch,
  onMenu,
  onRemove,
  prepared,
}: {
  entry: AppLauncherEntry;
  prepared?: PreparedAppLauncherEntry;
  onEdit: (entry: AppLauncherEntry) => void;
  onLaunch: (entry: AppLauncherEntry, mode: AppLauncherLaunchMode) => Promise<void>;
  onMenu: (state: MenuState) => void;
  onRemove: (entry: AppLauncherEntry) => Promise<void>;
}) {
  const { t } = useTranslation();
  const missing = prepared?.exists === false;
  return (
    <article
      className={`app-launcher-card ${missing ? "missing" : ""}`}
      onContextMenu={(event) => {
        event.preventDefault();
        onMenu({ entry, prepared, x: event.clientX, y: event.clientY });
      }}
    >
      <div className="app-launcher-card-icon">
        {entry.iconDataUrl || prepared?.iconDataUrl ? (
          <img alt="" src={entry.iconDataUrl ?? prepared?.iconDataUrl ?? undefined} />
        ) : (
          <Play size={19} />
        )}
      </div>
      <div className="app-launcher-card-main">
        <div>
          <h2>{entry.name}</h2>
          {entry.railPinned ? <span>{t("appLauncher.railPinned")}</span> : null}
        </div>
        <p>{entry.path}</p>
        {entry.arguments ? <code>{entry.arguments}</code> : null}
        {missing ? (
          <div className="app-launcher-warning">
            <AlertTriangle size={14} />
            {t("appLauncher.missingPath")}
          </div>
        ) : null}
      </div>
      <div className="app-launcher-card-actions">
        <button
          className="icon-button"
          aria-label={t("appLauncher.launchApp", { name: entry.name })}
          onClick={() => void onLaunch(entry, "normal")}
          type="button"
        >
          <Play size={15} />
        </button>
        <button
          className="icon-button"
          aria-label={t("appLauncher.editApp", { name: entry.name })}
          onClick={() => onEdit(entry)}
          type="button"
        >
          <Pencil size={15} />
        </button>
        <button
          className="icon-button"
          aria-label={t("appLauncher.moreActions", { name: entry.name })}
          onClick={(event) =>
            onMenu({
              entry,
              prepared,
              x: event.currentTarget.getBoundingClientRect().left,
              y: event.currentTarget.getBoundingClientRect().bottom + 4,
            })
          }
          type="button"
        >
          <MoreHorizontal size={15} />
        </button>
        <button
          className="icon-button danger"
          aria-label={t("appLauncher.removeApp", { name: entry.name })}
          onClick={() => void onRemove(entry)}
          type="button"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

function AppLauncherDialog({
  draft,
  onClose,
  onSave,
  onUpdate,
}: {
  draft: EntryDraft;
  onClose: () => void;
  onSave: (draft: EntryDraft) => Promise<void>;
  onUpdate: (draft: EntryDraft) => void;
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const canSave = draft.name.trim() && draft.path.trim();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave || saving) {
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dialog-backdrop app-launcher-dialog-backdrop">
      <form className="app-launcher-dialog" onSubmit={(event) => void handleSubmit(event)}>
        <header>
          <div>
            <p className="panel-label">{t("appLauncher.dialogLabel")}</p>
            <h2>{t("appLauncher.dialogTitle")}</h2>
          </div>
        </header>
        <label className="app-launcher-field">
          <span>{t("appLauncher.name")}</span>
          <input
            value={draft.name}
            onChange={(event) => onUpdate({ ...draft, name: event.target.value })}
          />
        </label>
        <label className="app-launcher-field">
          <span>{t("appLauncher.path")}</span>
          <input
            value={draft.path}
            onChange={(event) => onUpdate({ ...draft, path: event.target.value })}
          />
        </label>
        <label className="app-launcher-field">
          <span>{t("appLauncher.arguments")}</span>
          <input
            placeholder={t("appLauncher.argumentsPlaceholder")}
            value={draft.arguments}
            onChange={(event) => onUpdate({ ...draft, arguments: event.target.value })}
          />
        </label>
        <label className="app-launcher-field">
          <span>{t("appLauncher.workingDirectory")}</span>
          <input
            placeholder={t("appLauncher.workingDirectoryPlaceholder")}
            value={draft.workingDirectory}
            onChange={(event) => onUpdate({ ...draft, workingDirectory: event.target.value })}
          />
        </label>
        <label className="app-launcher-checkbox">
          <input
            checked={draft.railPinned}
            onChange={(event) => onUpdate({ ...draft, railPinned: event.target.checked })}
            type="checkbox"
          />
          <span>{t("appLauncher.pinToRail")}</span>
        </label>
        <div className="app-launcher-dialog-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            {t("common.cancel")}
          </button>
          <button className="primary-button" disabled={!canSave || saving} type="submit">
            {t("common.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function AppLauncherMenu({
  menuRef,
  onClose,
  onEdit,
  onLaunch,
  onRemove,
  state,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  onEdit: (entry: AppLauncherEntry) => void;
  onLaunch: (entry: AppLauncherEntry, mode: AppLauncherLaunchMode) => Promise<void>;
  onRemove: (entry: AppLauncherEntry) => Promise<void>;
  state: MenuState;
}) {
  const { t } = useTranslation();
  const runnable = state.prepared?.runnable ?? isRunnablePath(state.entry.path);
  return (
    <div
      ref={menuRef}
      className="terminal-menu app-launcher-menu"
      onContextMenu={(event) => event.preventDefault()}
      role="menu"
    >
      <MenuButton
        icon={<Play size={14} />}
        label={t("appLauncher.runNormal")}
        onClick={() => {
          onClose();
          void onLaunch(state.entry, "normal");
        }}
      />
      <MenuButton
        disabled={!runnable}
        icon={<Shield size={14} />}
        label={t("appLauncher.runAdmin")}
        onClick={() => {
          onClose();
          void onLaunch(state.entry, "admin");
        }}
      />
      <MenuButton
        disabled={!runnable}
        icon={<UserRound size={14} />}
        label={t("appLauncher.runAsUser")}
        onClick={() => {
          onClose();
          void onLaunch(state.entry, "differentUser");
        }}
      />
      <MenuButton
        icon={<Pencil size={14} />}
        label={t("appLauncher.edit")}
        onClick={() => {
          onClose();
          onEdit(state.entry);
        }}
      />
      <MenuButton
        danger
        icon={<Trash2 size={14} />}
        label={t("appLauncher.remove")}
        onClick={() => {
          onClose();
          void onRemove(state.entry);
        }}
      />
    </div>
  );
}

function MenuButton({
  danger,
  disabled,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`terminal-menu-item ${danger ? "danger" : ""}`}
      disabled={disabled}
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
