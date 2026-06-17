import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Convert from "ansi-to-html";
import DOMPurify from "dompurify";
import { invokeCommand } from "../../../../../lib/tauri";

/** Maximum lines rendered at once to keep very large logs responsive. */
const MAX_RENDERED_LINES = 5000;
/** Tail poll interval while "follow" is enabled and the tab is active. */
const FOLLOW_INTERVAL_MS = 2000;

type LogLevel = "error" | "warn" | "info" | "debug" | "trace" | "none";

const LEVEL_PATTERNS: { level: LogLevel; pattern: RegExp }[] = [
  { level: "error", pattern: /\b(error|err|fatal|crit(ical)?|panic|fail(ed|ure)?)\b/i },
  { level: "warn", pattern: /\b(warn(ing)?)\b/i },
  { level: "info", pattern: /\b(info|notice)\b/i },
  { level: "debug", pattern: /\b(debug)\b/i },
  { level: "trace", pattern: /\b(trace|verbose)\b/i },
];

const FILTERABLE_LEVELS: LogLevel[] = ["error", "warn", "info", "debug", "trace"];

function detectLevel(line: string): LogLevel {
  for (const { level, pattern } of LEVEL_PATTERNS) {
    if (pattern.test(line)) {
      return level;
    }
  }
  return "none";
}

const ESCAPE = "";

/**
 * Dedicated log mode: parses lines, tags severity for coloring, supports a text
 * filter, per-level toggles, ANSI-color rendering, and an optional follow/tail
 * mode that polls the file end (only while enabled and the tab is active — an
 * explicit, user-chosen monitor, not background polling).
 */
export function LogViewer({
  text,
  filePath,
  isActive,
  maxBytes,
}: {
  text: string;
  filePath: string;
  isActive: boolean;
  maxBytes: number;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [follow, setFollow] = useState(false);
  const [liveText, setLiveText] = useState<string | null>(null);
  const [hiddenLevels, setHiddenLevels] = useState<Set<LogLevel>>(new Set());
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const ansiConvert = useMemo(() => new Convert({ newline: false, escapeXML: true }), []);

  // Follow/tail: poll the trailing bytes of the file while enabled and active.
  useEffect(() => {
    if (!follow || !isActive) {
      return;
    }
    let disposed = false;
    const poll = async () => {
      try {
        const result = await invokeCommand("read_file_view_text", {
          request: { path: filePath, maxBytes, fromEnd: true },
        });
        if (!disposed) {
          setLiveText(result.text);
        }
      } catch {
        // Transient read failures (file rotated/locked) are ignored; the next
        // tick retries.
      }
    };
    void poll();
    const handle = window.setInterval(() => void poll(), FOLLOW_INTERVAL_MS);
    return () => {
      disposed = true;
      window.clearInterval(handle);
    };
  }, [follow, isActive, filePath, maxBytes]);

  const source = follow && liveText !== null ? liveText : text;

  const lines = useMemo(() => {
    const hasAnsi = source.includes(ESCAPE);
    return source.split(/\r?\n/).map((raw, index) => ({
      index,
      raw,
      level: detectLevel(raw),
      html: hasAnsi ? DOMPurify.sanitize(ansiConvert.toHtml(raw)) : null,
    }));
  }, [source, ansiConvert]);

  const visibleLines = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = lines.filter((line) => {
      if (hiddenLevels.has(line.level)) {
        return false;
      }
      return needle ? line.raw.toLowerCase().includes(needle) : true;
    });
    return filtered.slice(0, MAX_RENDERED_LINES);
  }, [lines, filter, hiddenLevels]);

  // Keep the newest lines in view while following.
  useEffect(() => {
    if (follow && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLines, follow]);

  function toggleLevel(level: LogLevel) {
    setHiddenLevels((current) => {
      const next = new Set(current);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  }

  return (
    <div className="file-viewer-log">
      <div className="file-viewer-subtoolbar">
        <input
          className="file-viewer-filter"
          onChange={(event) => setFilter(event.currentTarget.value)}
          placeholder={t("workspace.fileViewer.filterLines")}
          value={filter}
        />
        <div className="file-viewer-level-chips">
          {FILTERABLE_LEVELS.map((level) => (
            <button
              className={`file-viewer-level-chip level-${level} ${
                hiddenLevels.has(level) ? "is-off" : ""
              }`}
              key={level}
              onClick={() => toggleLevel(level)}
              type="button"
            >
              {t(`workspace.fileViewer.level.${level}`)}
            </button>
          ))}
        </div>
        <label className="file-viewer-follow">
          <input
            checked={follow}
            onChange={(event) => setFollow(event.currentTarget.checked)}
            type="checkbox"
          />
          {t("workspace.fileViewer.follow")}
        </label>
      </div>
      <div className="file-viewer-log-scroll" ref={scrollRef}>
        {visibleLines.map((line) => (
          <div className={`file-viewer-log-line level-${line.level}`} key={line.index}>
            <span className="file-viewer-log-gutter">{line.index + 1}</span>
            {line.html !== null ? (
              <span
                className="file-viewer-log-text"
                dangerouslySetInnerHTML={{ __html: line.html }}
              />
            ) : (
              <span className="file-viewer-log-text">{line.raw}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
