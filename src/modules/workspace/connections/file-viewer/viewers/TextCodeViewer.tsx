import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { search, highlightSelectionMatches } from "@codemirror/search";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

/**
 * Read-only text/code viewer backed by CodeMirror 6 (already bundled). Provides
 * line numbers, in-document search, and large-document handling. Phase 1 is
 * read-only; the editing/save pipeline is Phase 3. Markdown source gets the
 * markdown language extension; everything else uses plain highlighting (no
 * per-language packages are bundled, so this stays zero-bloat).
 */
export function TextCodeViewer({
  text,
  language,
}: {
  text: string;
  language?: "markdown";
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }
    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      search({ top: true }),
      EditorView.lineWrapping,
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      oneDark,
    ];
    if (language === "markdown") {
      extensions.push(markdown());
    }
    const view = new EditorView({
      state: EditorState.create({ doc: text, extensions }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Recreate the editor when the document or language changes.
  }, [text, language]);

  return <div className="file-viewer-codemirror" ref={hostRef} />;
}
