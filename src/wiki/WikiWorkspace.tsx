import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  FileText,
  Link2,
  Loader2,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Search,
  Tags,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Connection, WikiPage, WikiPageNode, WikiSearchHit, WikiTree } from "../types";
import { invokeCommand, isTauriRuntime } from "../lib/tauri";
import { WikiEditor } from "./WikiEditor";
import { WikiPreview } from "./WikiPreview";
import { WikiTree as WikiTreeView } from "./WikiTree";
import {
  buildPageLookup,
  extractConnectionLinkTargets,
  extractWikiLinkTargets,
  findConnectionByWikiTarget,
  flattenWikiTree,
} from "./wikiMarkdown";
import {
  createWikiPage,
  deleteWikiAttachment,
  deleteWikiPage,
  exportWikiToZip,
  fetchWikiPage,
  fetchWikiTree,
  fileToBase64,
  saveWikiAttachment,
  searchWiki,
  updateWikiPage,
} from "./wikiCommands";

type ViewMode = "edit" | "split" | "view";

interface WikiWorkspaceProps {
  active: boolean;
  initialPageId?: string | null;
  onOpenConnection?: (connectionId: string) => void;
}

const SAVE_DEBOUNCE_MS = 800;
const SEARCH_DEBOUNCE_MS = 180;

export function WikiWorkspace({ active, initialPageId, onOpenConnection }: WikiWorkspaceProps) {
  const { t } = useTranslation();
  const [tree, setTree] = useState<WikiTree>({ roots: [] });
  const [selectedId, setSelectedId] = useState<string | null>(initialPageId ?? null);
  const [page, setPage] = useState<WikiPage | null>(null);
  const [pageDraft, setPageDraft] = useState<{ title: string; body: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<WikiSearchHit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allConnections = useGlobalConnections();

  const flatPages = useMemo(
    () => flattenWikiTree(tree.roots as ReadonlyArray<WikiPageNode> as never),
    [tree],
  );
  const pageLookup = useMemo(() => buildPageLookup(flatPages), [flatPages]);

  const connectionsById = useMemo(() => {
    const map = new Map<string, Connection>();
    for (const connection of allConnections) {
      map.set(connection.id, connection);
    }
    return map;
  }, [allConnections]);

  const previewContext = useMemo(
    () => ({ pages: pageLookup, connectionsById }),
    [pageLookup, connectionsById],
  );

  const currentStats = useMemo(() => {
    const body = pageDraft?.body ?? "";
    const words = body.trim() ? body.trim().split(/\s+/).length : 0;
    return { words, characters: body.length };
  }, [pageDraft?.body]);

  const refreshTree = useCallback(async () => {
    if (!isTauriRuntime()) {
      return;
    }
    try {
      const next = await fetchWikiTree();
      setTree(next);
    } catch (cause) {
      setError(t("wiki.loadFailed", { error: formatError(cause) }));
    }
  }, [t]);

  useEffect(() => {
    if (active) {
      void refreshTree();
    }
  }, [active, refreshTree]);

  useEffect(() => {
    if (initialPageId) {
      setSelectedId(initialPageId);
    }
  }, [initialPageId]);

  useEffect(() => {
    if (!selectedId) {
      setPage(null);
      setPageDraft(null);
      setDirty(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await fetchWikiPage(selectedId);
        if (cancelled) {
          return;
        }
        setPage(loaded);
        setPageDraft({ title: loaded.title, body: loaded.bodyMd });
        setDirty(false);
      } catch (cause) {
        if (!cancelled) {
          setError(t("wiki.loadFailed", { error: formatError(cause) }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedId, t]);

  const performSave = useCallback(
    async (override?: { title?: string; body?: string; connectionIds?: string[] }) => {
      if (!page || !pageDraft) {
        return;
      }
      const title = override?.title ?? pageDraft.title;
      const body = override?.body ?? pageDraft.body;
      const connectionIds = override?.connectionIds
        ?? mergeConnectionIdsFromBody(body, page.connectionIds, allConnections);
      setSaving(true);
      try {
        const updated = await updateWikiPage({
          id: page.id,
          title,
          bodyMd: body,
          connectionIds,
        });
        setPage(updated);
        setPageDraft({ title: updated.title, body: updated.bodyMd });
        setDirty(false);
        await refreshTree();
      } catch (cause) {
        setError(t("wiki.saveFailed", { error: formatError(cause) }));
      } finally {
        setSaving(false);
      }
    },
    [allConnections, page, pageDraft, refreshTree, t],
  );

  useEffect(() => {
    if (!dirty) {
      return;
    }
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      void performSave();
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [dirty, performSave]);

  const handleCreate = useCallback(
    async (parentId: string | null, title?: string) => {
      try {
        const created = await createWikiPage({
          title: title?.trim() || t("wiki.untitled"),
          parentId,
        });
        await refreshTree();
        setSelectedId(created.id);
      } catch (cause) {
        setError(t("wiki.createFailed", { error: formatError(cause) }));
      }
    },
    [refreshTree, t],
  );

  const handleDelete = useCallback((pageId: string) => {
    setPendingDeleteId(pageId);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId) {
      return;
    }
    const pageId = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await deleteWikiPage(pageId);
      if (selectedId === pageId) {
        setSelectedId(null);
      }
      await refreshTree();
    } catch (cause) {
      setError(t("wiki.deleteFailed", { error: formatError(cause) }));
    }
  }, [pendingDeleteId, refreshTree, selectedId, t]);

  const handleExport = useCallback(async () => {
    try {
      const result = await exportWikiToZip();
      if (result) {
        setInfo(t("wiki.exportSuccess", { path: result.path }));
      }
    } catch (cause) {
      setError(t("wiki.exportFailed", { error: formatError(cause) }));
    }
  }, [t]);

  const handleAttach = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !page) {
        return;
      }
      for (const file of Array.from(files)) {
        try {
          const dataBase64 = await fileToBase64(file);
          await saveWikiAttachment({
            pageId: page.id,
            filename: file.name,
            dataBase64,
            mime: file.type || undefined,
          });
        } catch (cause) {
          setError(t("wiki.attachFailed", { error: formatError(cause) }));
        }
      }
      try {
        const reloaded = await fetchWikiPage(page.id);
        setPage(reloaded);
      } catch (cause) {
        setError(t("wiki.loadFailed", { error: formatError(cause) }));
      }
    },
    [page, t],
  );

  const handleAttachmentRemove = useCallback(
    async (attachmentId: string) => {
      if (!page) {
        return;
      }
      try {
        await deleteWikiAttachment(attachmentId);
        const reloaded = await fetchWikiPage(page.id);
        setPage(reloaded);
      } catch (cause) {
        setError(t("wiki.loadFailed", { error: formatError(cause) }));
      }
    },
    [page, t],
  );

  const handleConnectionsChange = useCallback(
    async (nextIds: string[]) => {
      if (!page) {
        return;
      }
      await performSave({ connectionIds: nextIds });
    },
    [page, performSave],
  );

  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    if (!searchQuery.trim()) {
      setSearchHits([]);
      return;
    }
    searchTimer.current = setTimeout(() => {
      void (async () => {
        try {
          const hits = await searchWiki(searchQuery, 30);
          setSearchHits(hits);
        } catch (cause) {
          setError(t("wiki.searchFailed", { error: formatError(cause) }));
        }
      })();
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
    };
  }, [searchQuery, t]);

  const handleEditorChange = useCallback((next: string) => {
    setPageDraft((current) => (
      current && current.body !== next ? { ...current, body: next } : current
    ));
    setDirty(true);
  }, []);

  const handleTitleChange = useCallback((next: string) => {
    setPageDraft((current) => (
      current && current.title !== next ? { ...current, title: next } : current
    ));
    setDirty(true);
  }, []);

  const handleOpenWikiLink = useCallback(
    async (target: string) => {
      const existing = resolvePageTarget(target, flatPages);
      if (existing) {
        setSelectedId(existing.id);
        return;
      }
      await handleCreate(null, target);
    },
    [flatPages, handleCreate],
  );

  return (
    <div
      className={`wiki-workspace ${leftCollapsed ? "wiki-left-collapsed" : ""} ${
        rightCollapsed ? "wiki-right-collapsed" : ""
      } relative flex h-full min-h-0 flex-1`}
      role="region"
      aria-label={t("wiki.title")}
    >
      <aside className="wiki-tree-pane flex min-h-0 shrink-0 flex-col">
        <div className="wiki-side-header">
          <div className="wiki-side-title">
            <BookOpen size={15} />
            <span>{t("wiki.title")}</span>
          </div>
          <button
            type="button"
            className="wiki-icon-button"
            onClick={() => setLeftCollapsed(true)}
            aria-label={t("wiki.collapseExplorer")}
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
        <div className="wiki-search">
          <Search size={13} aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("wiki.searchPlaceholder")}
            aria-label={t("wiki.searchPlaceholder")}
          />
        </div>
        {searchQuery.trim() ? (
          <SearchResultsList hits={searchHits} onSelect={setSelectedId} />
        ) : (
          <div className="wiki-tree-scroll min-h-0 flex-1 overflow-y-auto py-1">
            <WikiTreeView
              roots={tree.roots}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onCreateChild={handleCreate}
              onDelete={handleDelete}
            />
          </div>
        )}
      </aside>

      {leftCollapsed ? (
        <button
          type="button"
          className="wiki-floating-toggle wiki-floating-toggle-left"
          onClick={() => setLeftCollapsed(false)}
          aria-label={t("wiki.expandExplorer")}
        >
          <PanelLeftOpen size={15} />
        </button>
      ) : null}

      {pendingDeleteId ? (
        <DeletePageDialog
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}

      <main className="wiki-detail flex min-w-0 flex-1 flex-col">
        <div className="wiki-toolbar flex items-center gap-2">
          <span className="wiki-status flex items-center gap-1">
            {saving ? <Loader2 size={13} className="animate-spin" /> : null}
            {dirty ? t("wiki.unsaved") : page ? t("wiki.saved") : null}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ViewModeToggle current={viewMode} onChange={setViewMode} />
            <button
              type="button"
              className="wiki-toolbar-button"
              onClick={() => void handleExport()}
            >
              <Download size={14} />
              <span className="wiki-toolbar-button-label">{t("wiki.export")}</span>
            </button>
          </div>
        </div>

        {error ? (
          <Banner kind="error" message={error} onDismiss={() => setError(null)} />
        ) : null}
        {info ? (
          <Banner kind="info" message={info} onDismiss={() => setInfo(null)} />
        ) : null}

        {!page || !pageDraft ? (
          <div className="wiki-empty flex flex-1 items-center justify-center">
            <div>
              <BookOpen size={34} />
              <p>{t("wiki.noSelection")}</p>
              <button
                type="button"
                className="wiki-primary-button"
                onClick={() => void handleCreate(null)}
              >
                {t("wiki.createFirstPage")}
              </button>
            </div>
          </div>
        ) : (
          <div className="wiki-editor-frame flex min-h-0 flex-1 flex-col">
            <div className="wiki-title-row">
              <FileText size={16} />
              <input
                type="text"
                value={pageDraft.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder={t("wiki.pageTitlePlaceholder")}
                aria-label={t("wiki.pageTitlePlaceholder")}
              />
            </div>
            <div className={`wiki-edit-area wiki-mode-${viewMode} flex min-h-0 flex-1`}>
              {viewMode !== "view" ? (
                <section className="wiki-edit-pane" aria-label={t("wiki.editor")}>
                  <WikiEditor
                    value={pageDraft.body}
                    onChange={handleEditorChange}
                    ariaLabel={t("wiki.editor")}
                    placeholderText={t("wiki.bodyPlaceholder")}
                  />
                </section>
              ) : null}
              {viewMode !== "edit" ? (
                <section className="wiki-view-pane" aria-label={t("wiki.preview")}>
                  <WikiPreview
                    body={pageDraft.body}
                    context={previewContext}
                    onOpenWikiLink={(id) => void handleOpenWikiLink(id)}
                    onOpenConnection={onOpenConnection}
                    onSelectTag={(tag) => setSearchQuery(`#${tag}`)}
                  />
                </section>
              ) : null}
            </div>
            <div className="wiki-bottom-status">
              <span>{t("wiki.backlinkCount", { count: page.backlinks.length })}</span>
              <span>{t("wiki.wordCount", { count: currentStats.words })}</span>
              <span>{t("wiki.characterCount", { count: currentStats.characters })}</span>
            </div>
          </div>
        )}
      </main>

      {page && pageDraft && !rightCollapsed ? (
        <PageInspector
          page={page}
          body={pageDraft.body}
          pages={flatPages}
          allConnections={allConnections}
          onAttach={handleAttach}
          onAttachmentRemove={handleAttachmentRemove}
          onConnectionsChange={handleConnectionsChange}
          onOpenBacklink={(id) => void handleOpenWikiLink(id)}
          onSelectTag={(tag) => setSearchQuery(`#${tag}`)}
          onCollapse={() => setRightCollapsed(true)}
        />
      ) : null}

      {rightCollapsed ? (
        <button
          type="button"
          className="wiki-floating-toggle wiki-floating-toggle-right"
          onClick={() => setRightCollapsed(false)}
          aria-label={t("wiki.expandInspector")}
        >
          <PanelRightOpen size={15} />
        </button>
      ) : null}
    </div>
  );
}

function DeletePageDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="wiki-delete-dialog absolute inset-0 z-20 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wiki-delete-dialog-title"
        className="wiki-dialog"
      >
        <h3 id="wiki-delete-dialog-title">{t("wiki.deletePageTitle")}</h3>
        <p>{t("wiki.deleteConfirm")}</p>
        <div className="wiki-dialog-actions">
          <button type="button" className="wiki-secondary-button" onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button type="button" className="wiki-danger-button" onClick={onConfirm}>
            {t("common.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ViewModeToggle({ current, onChange }: { current: ViewMode; onChange: (next: ViewMode) => void }) {
  const { t } = useTranslation();
  const options: Array<{ key: ViewMode; label: string; icon: React.ReactNode }> = [
    { key: "edit", label: t("wiki.editorMode"), icon: <ChevronLeft size={13} /> },
    { key: "split", label: t("wiki.splitMode"), icon: <Columns3 size={13} /> },
    { key: "view", label: t("wiki.viewMode"), icon: <ChevronRight size={13} /> },
  ];
  return (
    <div className="wiki-viewmode" aria-label={t("wiki.viewModeLabel")}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={current === option.key ? "active" : ""}
          onClick={() => onChange(option.key)}
          aria-pressed={current === option.key}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function SearchResultsList({ hits, onSelect }: { hits: WikiSearchHit[]; onSelect: (id: string) => void }) {
  const { t } = useTranslation();
  if (hits.length === 0) {
    return <div className="wiki-search-empty">{t("wiki.searchEmpty")}</div>;
  }
  return (
    <ul className="wiki-search-results min-h-0 flex-1 overflow-y-auto">
      {hits.map((hit) => (
        <li key={hit.id}>
          <button type="button" className="wiki-search-hit" onClick={() => onSelect(hit.id)}>
            <span className="wiki-search-hit-title">{hit.title}</span>
            <span
              className="wiki-search-hit-snippet"
              dangerouslySetInnerHTML={{ __html: highlightSnippet(hit.snippet) }}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}

function PageInspector({
  page,
  body,
  pages,
  allConnections,
  onAttach,
  onAttachmentRemove,
  onConnectionsChange,
  onOpenBacklink,
  onSelectTag,
  onCollapse,
}: {
  page: WikiPage;
  body: string;
  pages: Array<{ id: string; title: string; slug: string }>;
  allConnections: Connection[];
  onAttach: (files: FileList | null) => void;
  onAttachmentRemove: (attachmentId: string) => void;
  onConnectionsChange: (nextIds: string[]) => void;
  onOpenBacklink: (pageId: string) => void;
  onSelectTag: (tag: string) => void;
  onCollapse: () => void;
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  return (
    <aside className="wiki-inspector flex min-h-0 shrink-0 flex-col">
      <div className="wiki-side-header">
        <div className="wiki-side-title">
          <Network size={15} />
          <span>{t("wiki.inspector")}</span>
        </div>
        <button
          type="button"
          className="wiki-icon-button"
          onClick={onCollapse}
          aria-label={t("wiki.collapseInspector")}
        >
          <PanelRightClose size={15} />
        </button>
      </div>
      <div className="wiki-inspector-scroll">
        <section className="wiki-inspector-section wiki-graph-section">
          <h4>
            <Network size={13} />
            {t("wiki.graph")}
          </h4>
          <MiniGraph page={page} body={body} pages={pages} connections={allConnections} />
        </section>

        <section className="wiki-inspector-section">
          <h4>
            <Link2 size={13} />
            {t("wiki.backlinks")}
          </h4>
          {page.backlinks.length === 0 ? (
            <p className="wiki-muted">{t("wiki.noBacklinks")}</p>
          ) : (
            <ul className="wiki-link-list">
              {page.backlinks.map((backlink) => (
                <li key={backlink.id}>
                  <button type="button" onClick={() => onOpenBacklink(backlink.id)}>
                    {backlink.title}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="wiki-inspector-section">
          <h4>
            <Tags size={13} />
            {t("wiki.tags")}
          </h4>
          {page.tags.length === 0 ? (
            <p className="wiki-muted">{t("wiki.noTags")}</p>
          ) : (
            <div className="wiki-tag-cloud">
              {page.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onSelectTag(tag)}
                  aria-label={t("wiki.filterByTag", { tag })}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="wiki-inspector-section">
          <h4>
            <Paperclip size={13} />
            {t("wiki.attachments")}
          </h4>
          <button
            type="button"
            className="wiki-secondary-button wiki-attach-button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={12} />
            {t("wiki.attach")}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => onAttach(event.target.files)}
          />
          <ul className="wiki-attachment-list">
            {page.attachments.length === 0 ? (
              <li className="wiki-muted">{t("wiki.noAttachments")}</li>
            ) : (
              page.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <span>{attachment.filename}</span>
                  <button
                    type="button"
                    onClick={() => onAttachmentRemove(attachment.id)}
                    aria-label={t("wiki.attachmentRemove")}
                  >
                    <X size={12} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="wiki-inspector-section">
          <h4>
            <Link2 size={13} />
            {t("wiki.connectionsLabel")}
          </h4>
          {allConnections.length === 0 ? (
            <p className="wiki-muted">{t("wiki.noConnections")}</p>
          ) : (
            <ul className="wiki-connection-list">
              {allConnections.map((connection) => {
                const checked = page.connectionIds.includes(connection.id);
                return (
                  <li key={connection.id}>
                    <input
                      id={`wiki-conn-${connection.id}`}
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const nextIds = event.target.checked
                          ? Array.from(new Set([...page.connectionIds, connection.id]))
                          : page.connectionIds.filter((id) => id !== connection.id);
                        onConnectionsChange(nextIds);
                      }}
                    />
                    <label htmlFor={`wiki-conn-${connection.id}`}>
                      <span>{connection.name}</span>
                      <small>{connection.type}</small>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </aside>
  );
}

function MiniGraph({
  page,
  body,
  pages,
  connections,
}: {
  page: WikiPage;
  body: string;
  pages: Array<{ id: string; title: string; slug: string }>;
  connections: Connection[];
}) {
  const { t } = useTranslation();
  const outgoingPages = extractWikiLinkTargets(body)
    .map((target) => resolvePageTarget(target, pages))
    .filter((target): target is { id: string; title: string; slug: string } => Boolean(target))
    .filter((target) => target.id !== page.id);
  const outgoingConnections = extractConnectionLinkTargets(body)
    .map((target) => findConnectionByWikiTarget(target, connections))
    .filter((target): target is Connection => Boolean(target));
  const nodes = [
    ...page.backlinks.slice(0, 4).map((node) => ({ id: `back-${node.id}`, label: node.title, kind: "back" })),
    ...outgoingPages.slice(0, 4).map((node) => ({ id: `page-${node.id}`, label: node.title, kind: "page" })),
    ...outgoingConnections.slice(0, 3).map((node) => ({ id: `conn-${node.id}`, label: node.name, kind: "connection" })),
  ];
  if (nodes.length === 0) {
    return <p className="wiki-muted">{t("wiki.graphEmpty")}</p>;
  }
  const center = { x: 132, y: 92 };
  const radius = 68;
  return (
    <svg className="wiki-mini-graph" viewBox="0 0 264 184" role="img" aria-label={t("wiki.graph")}>
      {nodes.map((node, index) => {
        const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;
        return (
          <g key={`edge-${node.id}`}>
            <line x1={center.x} y1={center.y} x2={x} y2={y} />
          </g>
        );
      })}
      <circle className="wiki-graph-node-current" cx={center.x} cy={center.y} r="13" />
      <text className="wiki-graph-label-current" x={center.x} y={center.y + 27} textAnchor="middle">
        {truncateLabel(page.title, 18)}
      </text>
      {nodes.map((node, index) => {
        const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
        const x = center.x + Math.cos(angle) * radius;
        const y = center.y + Math.sin(angle) * radius;
        return (
          <g key={node.id} className={`wiki-graph-node wiki-graph-node-${node.kind}`}>
            <circle cx={x} cy={y} r="9" />
            <text x={x} y={y + 22} textAnchor="middle">{truncateLabel(node.label, 14)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Banner({
  kind,
  message,
  onDismiss,
}: {
  kind: "error" | "info";
  message: string;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div role="status" className={`wiki-banner wiki-banner-${kind}`}>
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label={t("common.close")}>
        <X size={12} />
      </button>
    </div>
  );
}

function highlightSnippet(snippet: string): string {
  const escaped = snippet
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(/&lt;&lt;/g, "<mark>").replace(/&gt;&gt;/g, "</mark>");
}

function mergeConnectionIdsFromBody(
  body: string,
  existingIds: string[],
  connections: ReadonlyArray<Connection>,
): string[] {
  const ids = new Set(existingIds);
  for (const target of extractConnectionLinkTargets(body)) {
    const connection = findConnectionByWikiTarget(target, connections);
    if (connection) {
      ids.add(connection.id);
    }
  }
  return Array.from(ids);
}

function resolvePageTarget<T extends { id: string; title: string; slug: string }>(
  target: string,
  pages: ReadonlyArray<T>,
): T | undefined {
  const normalized = normalizeTitle(target);
  return pages.find((page) => (
    page.id === target || page.slug === target || normalizeTitle(page.title) === normalized
  ));
}

function normalizeTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function truncateLabel(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function useGlobalConnections(): Connection[] {
  const [connections, setConnections] = useState<Connection[]>([]);
  useEffect(() => {
    if (!isTauriRuntime()) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const tree = await invokeCommand("list_connection_tree");
        if (!cancelled) {
          setConnections(flattenConnectionTree(tree));
        }
      } catch {
        // Connections list is optional for the wiki workspace.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return connections;
}

interface ConnectionTreeLike {
  connections: Connection[];
  folders: Array<{
    connections: Connection[];
    folders: ConnectionTreeLike["folders"];
  }>;
}

function flattenConnectionTree(tree: ConnectionTreeLike): Connection[] {
  const result: Connection[] = [...tree.connections];
  for (const folder of tree.folders) {
    result.push(...flattenConnectionTree(folder));
  }
  return result;
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
