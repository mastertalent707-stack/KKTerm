import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

/**
 * Renders Markdown to sanitized HTML. The same marked + DOMPurify pairing used
 * by the assistant and manual renderers; raw HTML in the source is sanitized
 * before it reaches the DOM.
 */
export function MarkdownViewer({ text }: { text: string }) {
  const html = useMemo(() => {
    const parsed = marked.parse(text, { async: false }) as string;
    return DOMPurify.sanitize(parsed);
  }, [text]);

  return (
    <div className="file-viewer-markdown" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
