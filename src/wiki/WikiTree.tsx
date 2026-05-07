import { ChevronDown, ChevronRight, FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { WikiPageNode } from "../types";

interface WikiTreeProps {
  roots: WikiPageNode[];
  selectedId?: string | null;
  onSelect: (pageId: string) => void;
  onCreateChild: (parentId: string | null) => void;
  onDelete: (pageId: string) => void;
}

export function WikiTree({
  roots,
  selectedId,
  onSelect,
  onCreateChild,
  onDelete,
}: WikiTreeProps) {
  const { t } = useTranslation();

  if (roots.length === 0) {
    return (
      <div className="wiki-tree-empty p-3 text-xs opacity-70">
        <p>{t("wiki.rootEmpty")}</p>
        <button
          type="button"
          className="wiki-tree-empty-action mt-2 inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-black/5"
          onClick={() => onCreateChild(null)}
        >
          <Plus size={12} />
          {t("wiki.createFirstPage")}
        </button>
      </div>
    );
  }

  return (
    <div className="wiki-tree">
      <div className="wiki-tree-toolbar flex items-center justify-between px-2 py-1 text-[11px] uppercase tracking-wide opacity-70">
        <span>{t("wiki.title")}</span>
        <button
          type="button"
          className="wiki-tree-add inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-black/5"
          onClick={() => onCreateChild(null)}
          title={t("wiki.newPage")}
          aria-label={t("wiki.newPage")}
        >
          <Plus size={12} />
        </button>
      </div>
      <ul className="wiki-tree-list pl-1">
        {roots.map((node) => (
          <WikiTreeNode
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            onCreateChild={onCreateChild}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}

interface WikiTreeNodeProps {
  node: WikiPageNode;
  depth: number;
  selectedId?: string | null;
  onSelect: (pageId: string) => void;
  onCreateChild: (parentId: string | null) => void;
  onDelete: (pageId: string) => void;
}

function WikiTreeNode({
  node,
  depth,
  selectedId,
  onSelect,
  onCreateChild,
  onDelete,
}: WikiTreeNodeProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <li className="wiki-tree-item">
      <div
        className={`wiki-tree-row group flex items-center gap-1 rounded px-1 py-0.5 text-sm hover:bg-black/5 ${
          isSelected ? "bg-black/10" : ""
        }`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="wiki-tree-toggle inline-flex h-5 w-5 items-center justify-center opacity-60 hover:opacity-100"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? t("wiki.collapse") : t("wiki.expand")}
          aria-expanded={expanded}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
          ) : null}
        </button>
        <button
          type="button"
          className="wiki-tree-label flex-1 truncate text-left"
          onClick={() => onSelect(node.id)}
          title={node.title}
        >
          <span className="inline-flex items-center gap-1">
            <FileText size={12} className="opacity-70" />
            {node.title || t("wiki.untitled")}
          </span>
        </button>
        <div className="wiki-tree-actions invisible flex items-center gap-0.5 group-hover:visible">
          <button
            type="button"
            className="wiki-tree-add-child inline-flex h-5 w-5 items-center justify-center rounded hover:bg-black/10"
            onClick={(event) => {
              event.stopPropagation();
              onCreateChild(node.id);
            }}
            title={t("wiki.newSubpage")}
            aria-label={t("wiki.newSubpage")}
          >
            <Plus size={12} />
          </button>
          <button
            type="button"
            className="wiki-tree-delete inline-flex h-5 w-5 items-center justify-center rounded hover:bg-red-500/15"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(node.id);
            }}
            title={t("wiki.delete")}
            aria-label={t("wiki.delete")}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      {hasChildren && expanded ? (
        <ul className="wiki-tree-children">
          {node.children.map((child) => (
            <WikiTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onCreateChild={onCreateChild}
              onDelete={onDelete}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
