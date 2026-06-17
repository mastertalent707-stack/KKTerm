import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Save } from "lucide-react";
import type { WorkspaceTab } from "../../../../types";
import { confirmNativeDialog, invokeCommand, type FileViewProbe } from "../../../../lib/tauri";
import {
  availableViewerKinds,
  detectViewerKind,
  fileBaseName,
  isEditableText,
  viewerLoadsText,
  viewerUsesExternalDependency,
  type ViewerKind,
} from "./fileViewerModel";
import { TextCodeViewer } from "./viewers/TextCodeViewer";
import { MarkdownViewer } from "./viewers/MarkdownViewer";
import { CsvViewer } from "./viewers/CsvViewer";
import { JsonViewer } from "./viewers/JsonViewer";
import { ImageViewer } from "./viewers/ImageViewer";
import { LogViewer } from "./viewers/LogViewer";
import { HexViewer } from "./viewers/HexViewer";
import { PdfDependencyGate } from "./viewers/PdfDependencyGate";

/** Per-kind read caps (bytes). Text-shaped viewers and images differ widely. */
const TEXT_MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_MAX_BYTES = 25 * 1024 * 1024;
const HEX_MAX_BYTES = 1 * 1024 * 1024;

/** Error-message prefix the backend uses for a save conflict (mtime changed). */
const FILE_VIEW_CONFLICT = "FILE_VIEW_CONFLICT";

const MARKDOWN_PATH = /\.(md|markdown|mdown|mkd|mdx)$/i;

function maxBytesForKind(kind: ViewerKind): number {
  if (kind === "image") {
    return IMAGE_MAX_BYTES;
  }
  if (kind === "hex") {
    return HEX_MAX_BYTES;
  }
  return TEXT_MAX_BYTES;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(1)} ${units[unit]}`;
}

interface LoadedContent {
  kind: ViewerKind;
  text?: string;
  base64?: string;
  magic?: string | null;
  truncated: boolean;
  mtimeMs?: number;
}

export function FileViewerWorkspace({
  isActive,
  tab,
}: {
  isActive: boolean;
  tab: WorkspaceTab;
}) {
  const { t } = useTranslation();
  const filePath = tab.connection?.localStartupDirectory?.trim() ?? "";
  const [probe, setProbe] = useState<FileViewProbe | null>(null);
  const [override, setOverride] = useState<ViewerKind | null>(null);
  const [content, setContent] = useState<LoadedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  // Editing state (Phase 3). `editedText` mirrors the uncontrolled editor's
  // current value so saves and the dirty indicator have it without re-rendering
  // the editor on each keystroke.
  const [editedText, setEditedText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(
    async (forcedKind: ViewerKind | null) => {
      if (!filePath) {
        setError(t("workspace.fileViewer.noFile"));
        return;
      }
      setLoading(true);
      setError("");
      setSaveError("");
      setEditedText(null);
      try {
        const probed = await invokeCommand("probe_file_view", {
          request: { path: filePath },
        });
        setProbe(probed);
        const kind =
          forcedKind ??
          detectViewerKind({ path: filePath, magic: probed.magic, isText: probed.isText });
        if (viewerUsesExternalDependency(kind)) {
          // The dependency-backed viewer (PDF) loads its own content through the
          // external tool; no direct read here.
          setContent({ kind, magic: probed.magic, truncated: false });
          return;
        }
        const maxBytes = maxBytesForKind(kind);
        if (viewerLoadsText(kind)) {
          const result = await invokeCommand("read_file_view_text", {
            request: { path: filePath, maxBytes },
          });
          setContent({
            kind,
            text: result.text,
            magic: probed.magic,
            truncated: result.truncated,
            mtimeMs: result.mtimeMs,
          });
        } else {
          if (kind === "image" && probed.totalSize > IMAGE_MAX_BYTES) {
            setContent(null);
            setError(t("workspace.fileViewer.imageTooLarge"));
            return;
          }
          const result = await invokeCommand("read_file_view_bytes", {
            request: { path: filePath, offset: 0, length: maxBytes },
          });
          setContent({
            kind,
            base64: result.base64,
            magic: probed.magic,
            truncated: !result.eof,
          });
        }
      } catch (loadError) {
        setContent(null);
        setError(loadError instanceof Error ? loadError.message : String(loadError));
      } finally {
        setLoading(false);
      }
    },
    [filePath, t],
  );

  useEffect(() => {
    void load(override);
    // Reload when the file, the chosen viewer override, or an explicit reload
    // changes. `load` is stable per filePath.
  }, [load, override, reloadToken]);

  const kinds = probe
    ? availableViewerKinds({ path: filePath, magic: probe.magic, isText: probe.isText })
    : [];
  const activeKind = content?.kind ?? override ?? (kinds[0] as ViewerKind | undefined);

  const baseline = content?.text ?? "";
  const dirty = editedText !== null && editedText !== baseline;
  const editable = content
    ? isEditableText({ kind: content.kind, truncated: content.truncated, text: baseline })
    : false;

  async function confirmDiscardIfDirty(): Promise<boolean> {
    if (!dirty) {
      return true;
    }
    return (await confirmNativeDialog(t("workspace.fileViewer.discardConfirm"))) === true;
  }

  async function requestMode(kind: ViewerKind) {
    if (kind === activeKind) {
      return;
    }
    if (await confirmDiscardIfDirty()) {
      setOverride(kind);
    }
  }

  async function requestReload() {
    if (await confirmDiscardIfDirty()) {
      setReloadToken((token) => token + 1);
    }
  }

  async function writeOnce(force: boolean): Promise<boolean> {
    const result = await invokeCommand("write_file_view", {
      request: {
        path: filePath,
        content: editedText ?? baseline,
        expectedMtimeMs: content?.mtimeMs,
        force,
      },
    });
    setContent((current) =>
      current
        ? { ...current, text: editedText ?? baseline, mtimeMs: result.mtimeMs, truncated: false }
        : current,
    );
    setEditedText(null);
    return true;
  }

  async function save() {
    if (!editable || !dirty || saving) {
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await writeOnce(false);
    } catch (firstError) {
      const message = firstError instanceof Error ? firstError.message : String(firstError);
      if (message.includes(FILE_VIEW_CONFLICT)) {
        const overwrite = await confirmNativeDialog(t("workspace.fileViewer.saveConflictConfirm"));
        if (overwrite === true) {
          try {
            await writeOnce(true);
          } catch (forcedError) {
            setSaveError(forcedError instanceof Error ? forcedError.message : String(forcedError));
          }
        }
      } else {
        setSaveError(message);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={isActive ? "file-viewer-workspace active" : "file-viewer-workspace"}>
      <div className="file-viewer-toolbar">
        <span className="file-viewer-name" title={filePath}>
          {fileBaseName(filePath) || t("connections.fileView")}
          {dirty ? <span className="file-viewer-dirty-dot" aria-hidden="true" /> : null}
        </span>
        {probe ? <span className="file-viewer-size">{formatBytes(probe.totalSize)}</span> : null}
        <div className="file-viewer-toolbar-spacer" />
        {editable ? (
          <button
            className="toolbar-button file-viewer-save"
            disabled={!dirty || saving}
            onClick={() => void save()}
            title={t("workspace.fileViewer.save")}
            type="button"
          >
            <Save size={14} />
            <span>{saving ? t("workspace.fileViewer.saving") : t("workspace.fileViewer.save")}</span>
          </button>
        ) : null}
        {kinds.length > 1 ? (
          <div className="file-viewer-mode-switch">
            {kinds.map((kind) => (
              <button
                className={`toolbar-button ${kind === activeKind ? "is-active" : ""}`}
                key={kind}
                onClick={() => void requestMode(kind)}
                type="button"
              >
                {t(`workspace.fileViewer.kind.${kind}`)}
              </button>
            ))}
          </div>
        ) : null}
        <button
          className="toolbar-button"
          onClick={() => void requestReload()}
          title={t("common.refresh")}
          type="button"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {content?.truncated ? (
        <div className="file-viewer-notice">{t("workspace.fileViewer.truncated")}</div>
      ) : null}
      {saveError ? (
        <div className="file-viewer-notice file-viewer-notice-warn">{saveError}</div>
      ) : null}

      <div className="file-viewer-body">
        {loading ? (
          <div className="file-viewer-status">{t("workspace.fileViewer.loading")}</div>
        ) : error ? (
          <div className="file-viewer-status file-viewer-status-error">{error}</div>
        ) : content ? (
          <FileViewerContent
            content={content}
            editable={editable}
            editorKey={`${filePath}:${reloadToken}:${activeKind}`}
            filePath={filePath}
            isActive={isActive}
            onEditChange={setEditedText}
            onSave={() => void save()}
          />
        ) : null}
      </div>
    </div>
  );
}

function FileViewerContent({
  content,
  editable,
  editorKey,
  filePath,
  isActive,
  onEditChange,
  onSave,
}: {
  content: LoadedContent;
  editable: boolean;
  editorKey: string;
  filePath: string;
  isActive: boolean;
  onEditChange: (text: string) => void;
  onSave: () => void;
}) {
  switch (content.kind) {
    case "markdown":
      return <MarkdownViewer text={content.text ?? ""} />;
    case "csv":
      return (
        <CsvViewer
          delimiter={filePath.toLowerCase().endsWith(".tsv") ? "\t" : undefined}
          text={content.text ?? ""}
        />
      );
    case "json":
      return <JsonViewer text={content.text ?? ""} />;
    case "image":
      return <ImageViewer base64={content.base64 ?? ""} magic={content.magic} path={filePath} />;
    case "pdf":
      return <PdfDependencyGate filePath={filePath} isActive={isActive} />;
    case "log":
      return (
        <LogViewer
          filePath={filePath}
          isActive={isActive}
          maxBytes={TEXT_MAX_BYTES}
          text={content.text ?? ""}
        />
      );
    case "hex":
      return <HexViewer base64={content.base64 ?? ""} />;
    case "text":
    default:
      return (
        <TextCodeViewer
          editable={editable}
          initialText={content.text ?? ""}
          key={editorKey}
          language={MARKDOWN_PATH.test(filePath) ? "markdown" : undefined}
          onChange={onEditChange}
          onSave={onSave}
        />
      );
  }
}
