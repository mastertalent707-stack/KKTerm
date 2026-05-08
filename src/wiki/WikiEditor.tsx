import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput } from "@codemirror/language";
import { searchKeymap } from "@codemirror/search";
import { Compartment, EditorState } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import type { DecorationSet, ViewUpdate } from "@codemirror/view";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const WIKI_TOKEN_REGEX = /\[\[\[([^\]\n]+)\]\]\]|\[\[([^\]\n]+)\]\]|(^|[\s(])#([A-Za-z0-9][A-Za-z0-9_-]*)\b/gm;

const wikiTokenPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

function buildDecorations(view: EditorView): DecorationSet {
  const builder: Array<{ from: number; to: number; value: Decoration }> = [];
  for (const { from, to } of view.visibleRanges) {
    const text = view.state.sliceDoc(from, to);
    pushTokenMatches(text, from, builder);
  }
  builder.sort((a, b) => a.from - b.from || a.to - b.to);
  const set = Decoration.none.update({
    add: builder.map((entry) => entry.value.range(entry.from, entry.to)),
  });
  return set;
}

function pushTokenMatches(
  text: string,
  base: number,
  out: Array<{ from: number; to: number; value: Decoration }>,
) {
  WIKI_TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null = WIKI_TOKEN_REGEX.exec(text);
  while (match) {
    const tagPrefix = match[3] ?? "";
    const from = base + match.index + tagPrefix.length;
    const to = base + match.index + match[0].length;
    const className = match[1] !== undefined
      ? "cm-wiki-connection"
      : match[4] !== undefined
        ? "cm-wiki-tag"
        : "cm-wiki-link";
    out.push({ from, to, value: Decoration.mark({ class: className }) });
    match = WIKI_TOKEN_REGEX.exec(text);
  }
}

const wikiTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "14px",
    backgroundColor: "var(--wiki-editor-bg, var(--chrome))",
    color: "var(--text)",
  },
  ".cm-scroller": {
    fontFamily: "var(--mono-font, ui-monospace, SFMono-Regular, Menlo, monospace)",
    lineHeight: "1.55",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "var(--wiki-faint, var(--text-faint))",
  },
  ".cm-activeLine": {
    backgroundColor: "var(--wiki-accent-soft, var(--accent-soft, transparent))",
  },
  ".cm-wiki-link": {
    color: "var(--accent)",
    fontWeight: 500,
  },
  ".cm-wiki-connection": {
    color: "var(--wiki-connection, var(--accent))",
    fontStyle: "italic",
  },
  ".cm-wiki-tag": {
    color: "var(--wiki-tag, var(--green))",
    fontWeight: 600,
  },
});

interface WikiEditorProps {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
  ariaLabel?: string;
  placeholderText?: string;
}

export function WikiEditor({
  value,
  onChange,
  readOnly,
  ariaLabel,
  placeholderText,
}: WikiEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const latestValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const readOnlyCompartment = useRef(new Compartment());
  const { t } = useTranslation();

  onChangeRef.current = onChange;
  latestValueRef.current = value;

  useEffect(() => {
    if (!hostRef.current) {
      return;
    }
    const compartment = readOnlyCompartment.current;
    const state = EditorState.create({
      doc: value,
      extensions: [
        history(),
        lineNumbers(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        markdown({ base: markdownLanguage }),
        placeholder(placeholderText ?? ""),
        highlightActiveLine(),
        wikiTokenPlugin,
        wikiTheme,
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        compartment.of(EditorState.readOnly.of(Boolean(readOnly))),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const next = update.state.doc.toString();
            if (next !== latestValueRef.current) {
              latestValueRef.current = next;
              onChangeRef.current(next);
            }
          }
        }),
        EditorView.contentAttributes.of({ "aria-label": ariaLabel ?? t("wiki.editorAria") }),
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // We intentionally only initialize once; updates are reconciled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
      latestValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    view.dispatch({
      effects: readOnlyCompartment.current.reconfigure(
        EditorState.readOnly.of(Boolean(readOnly)),
      ),
    });
  }, [readOnly]);

  return <div ref={hostRef} className="wiki-editor-host" />;
}
