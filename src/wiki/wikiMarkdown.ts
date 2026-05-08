import { marked } from "marked";
import DOMPurify from "dompurify";
import type { Connection, WikiPageSummary } from "../types";

export interface WikiPageLookup {
  byId: Map<string, WikiPageSummary>;
  bySlug: Map<string, WikiPageSummary>;
  byTitle: Map<string, WikiPageSummary>;
}

export interface WikiPreviewContext {
  pages: WikiPageLookup;
  connectionsById: Map<string, Connection>;
}

const WIKI_TOKEN_PATTERN = /\[\[\[([^\]\n]+)\]\]\]|\[\[([^\]\n]+)\]\]/g;
const TAG_PATTERN = /(^|[\s(])#([A-Za-z0-9][A-Za-z0-9_-]*)\b/g;

export function buildPageLookup(pages: WikiPageSummary[]): WikiPageLookup {
  const byId = new Map<string, WikiPageSummary>();
  const bySlug = new Map<string, WikiPageSummary>();
  const byTitle = new Map<string, WikiPageSummary>();
  for (const page of pages) {
    byId.set(page.id, page);
    bySlug.set(page.slug, page);
    byTitle.set(normalizeWikiTitle(page.title), page);
  }
  return { byId, bySlug, byTitle };
}

export function flattenWikiTree(roots: WikiPageSummary[]): WikiPageSummary[] {
  const result: WikiPageSummary[] = [];
  function walk(items: ReadonlyArray<WikiPageSummary & { children?: ReadonlyArray<WikiPageSummary> }>) {
    for (const item of items) {
      result.push({
        id: item.id,
        parentId: item.parentId ?? null,
        title: item.title,
        slug: item.slug,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      if (item.children && item.children.length > 0) {
        walk(item.children as Array<WikiPageSummary & { children?: ReadonlyArray<WikiPageSummary> }>);
      }
    }
  }
  walk(roots as Array<WikiPageSummary & { children?: ReadonlyArray<WikiPageSummary> }>);
  return result;
}

export function renderWikiMarkdown(
  body: string,
  context: WikiPreviewContext,
): string {
  const transformed = transformWikiTokens(body, context);
  const html = marked.parse(transformed, {
    async: false,
    breaks: false,
    gfm: true,
  }) as string;
  return DOMPurify.sanitize(html, {
    ADD_ATTR: [
      "data-wiki-link",
      "data-connection-embed",
      "data-connection-name",
      "data-attachment",
      "data-wiki-tag",
    ],
  });
}

function transformWikiTokens(body: string, context: WikiPreviewContext): string {
  const withLinks = body.replace(
    WIKI_TOKEN_PATTERN,
    (_match, rawConnection: string | undefined, rawPage: string | undefined) => {
      if (rawConnection !== undefined) {
        return renderConnectionLink(rawConnection, context);
      }
      const raw = rawPage ?? "";
      const [rawTarget, rawLabel] = raw.split("|");
      const target = (rawTarget ?? "").trim();
      const page = resolveWikiPage(target, context.pages);
      const label = (rawLabel ?? page?.title ?? target).trim();
      if (!page) {
        return `<span class="wiki-link wiki-link-missing" data-wiki-link="${escapeHtmlAttribute(target)}">${escapeHtml(label)}</span>`;
      }
      return `<a class="wiki-link" href="#wiki/${escapeHtmlAttribute(page.id)}" data-wiki-link="${escapeHtmlAttribute(page.id)}">${escapeHtml(label)}</a>`;
    },
  );

  return withLinks.replace(TAG_PATTERN, (_match, prefix: string, tag: string) => {
    return `${prefix}<span class="wiki-tag-token" data-wiki-tag="${escapeHtmlAttribute(tag)}">#${escapeHtml(tag)}</span>`;
  });
}

function renderConnectionLink(raw: string, context: WikiPreviewContext): string {
  const [rawTarget, rawLabel] = raw.split("|");
  const target = (rawTarget ?? "").trim();
  const connection = resolveConnection(target, context.connectionsById);
  const label = (rawLabel ?? connection?.name ?? target).trim();
  if (!connection) {
    return `<span class="wiki-connection-embed wiki-connection-missing" data-connection-name="${escapeHtmlAttribute(target)}">${escapeHtml(label)}</span>`;
  }
  return `<span class="wiki-connection-embed" data-connection-embed="${escapeHtmlAttribute(connection.id)}" tabindex="0" role="button">${escapeHtml(label)}<span class="wiki-connection-meta"> · ${escapeHtml(connection.type)}</span></span>`;
}

function resolveConnection(
  target: string,
  connectionsById: Map<string, Connection>,
): Connection | undefined {
  const byId = connectionsById.get(target);
  if (byId) {
    return byId;
  }
  const normalizedTarget = normalizeWikiTitle(target);
  for (const connection of connectionsById.values()) {
    if (normalizeWikiTitle(connection.name) === normalizedTarget) {
      return connection;
    }
  }
  return undefined;
}

function resolveWikiPage(target: string, pages: WikiPageLookup): WikiPageSummary | undefined {
  return pages.byId.get(target)
    ?? pages.bySlug.get(target)
    ?? pages.byTitle.get(normalizeWikiTitle(target));
}

function normalizeWikiTitle(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtml(value);
}

export function extractAttachmentReferences(body: string): string[] {
  const result = new Set<string>();
  const pattern = /attachments\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+/g;
  let match: RegExpExecArray | null = pattern.exec(body);
  while (match) {
    result.add(match[0]);
    match = pattern.exec(body);
  }
  return Array.from(result);
}

export function extractWikiLinkTargets(body: string): string[] {
  const result = new Set<string>();
  WIKI_TOKEN_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null = WIKI_TOKEN_PATTERN.exec(body);
  while (match) {
    if (match[2] !== undefined) {
      const target = match[2].split("|")[0]?.trim();
      if (target) {
        result.add(target);
      }
    }
    match = WIKI_TOKEN_PATTERN.exec(body);
  }
  return Array.from(result);
}

export function extractConnectionLinkTargets(body: string): string[] {
  const result = new Set<string>();
  WIKI_TOKEN_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null = WIKI_TOKEN_PATTERN.exec(body);
  while (match) {
    if (match[1] !== undefined) {
      const target = match[1].split("|")[0]?.trim();
      if (target) {
        result.add(target);
      }
    }
    match = WIKI_TOKEN_PATTERN.exec(body);
  }
  return Array.from(result);
}

export function findConnectionByWikiTarget(
  target: string,
  connections: ReadonlyArray<Connection>,
): Connection | undefined {
  const normalizedTarget = normalizeWikiTitle(target);
  return connections.find((connection) => (
    connection.id === target || normalizeWikiTitle(connection.name) === normalizedTarget
  ));
}
