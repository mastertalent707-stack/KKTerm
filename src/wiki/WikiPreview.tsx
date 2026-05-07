import { useEffect, useMemo, useRef } from "react";
import { renderWikiMarkdown } from "./wikiMarkdown";
import type { WikiPreviewContext } from "./wikiMarkdown";

interface WikiPreviewProps {
  body: string;
  context: WikiPreviewContext;
  onOpenWikiLink?: (pageId: string) => void;
  onOpenConnection?: (connectionId: string) => void;
}

export function WikiPreview({
  body,
  context,
  onOpenWikiLink,
  onOpenConnection,
}: WikiPreviewProps) {
  const html = useMemo(() => renderWikiMarkdown(body, context), [body, context]);
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      const wikiLink = target.closest<HTMLElement>("[data-wiki-link]");
      if (wikiLink && onOpenWikiLink) {
        event.preventDefault();
        const id = wikiLink.getAttribute("data-wiki-link");
        if (id) {
          onOpenWikiLink(id);
        }
        return;
      }
      const embed = target.closest<HTMLElement>("[data-connection-embed]");
      if (embed && onOpenConnection) {
        event.preventDefault();
        const id = embed.getAttribute("data-connection-embed");
        if (id) {
          onOpenConnection(id);
        }
      }
    };
    host.addEventListener("click", handleClick);
    return () => host.removeEventListener("click", handleClick);
  }, [onOpenWikiLink, onOpenConnection]);

  return (
    <div
      ref={hostRef}
      className="wiki-preview prose prose-sm max-w-none"
      // Sanitized via DOMPurify in renderWikiMarkdown.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
