import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLine, keymap } from "@codemirror/view";
import { history, historyKeymap, defaultKeymap, indentWithTab } from "@codemirror/commands";
import { search, searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

/**
 * Text/code viewer and Phase 3 light editor backed by CodeMirror 6 (already
 * bundled): line numbers, in-document search, undo/redo history, and — when
 * `editable` — typing with a Ctrl/Cmd+S save shortcut. The editor is created
 * once per mounted document (the parent gives it a key that changes only on
 * file/reload, not on each keystroke) and is uncontrolled: edits flow out
 * through `onChange`, never back in, so the caret is never reset while typing.
 * Markdown source gets the markdown language extension; other files use plain
 * highlighting (no per-language packages are bundled, so this stays zero-bloat).
 */
export function TextCodeViewer({
  initialText,
  editable = false,
  language,
  onChange,
  onSave,
}: {
  initialText: string;
  editable?: boolean;
  language?: "markdown";
  onChange?: (text: string) => void;
  onSave?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  // Keep the latest callbacks reachable from CodeMirror extensions without
  // recreating the editor (which would drop edit history and caret position).
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }
    const extensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      history(),
      search({ top: true }),
      EditorView.lineWrapping,
      oneDark,
      keymap.of([
        {
          key: "Mod-s",
          preventDefault: true,
          run: () => {
            onSaveRef.current?.();
            return true;
          },
        },
        ...searchKeymap,
        ...historyKeymap,
        ...defaultKeymap,
        indentWithTab,
      ]),
      EditorState.readOnly.of(!editable),
      EditorView.editable.of(editable),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current?.(update.state.doc.toString());
        }
      }),
    ];
    if (language === "markdown") {
      extensions.push(markdown());
    }
    const view = new EditorView({
      state: EditorState.create({ doc: initialText, extensions }),
      parent: hostRef.current,
    });
    return () => {
      view.destroy();
    };
    // Intentionally created once per mount; the parent remounts (via key) on a
    // file change or reload. `initialText`/`editable`/`language` are read at
    // creation only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="file-viewer-codemirror" ref={hostRef} />;
}
