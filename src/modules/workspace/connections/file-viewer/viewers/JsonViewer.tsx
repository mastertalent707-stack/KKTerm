import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Pretty-prints JSON with stable 2-space indentation. Invalid JSON falls back to
 * the raw text so a malformed file is still viewable, with a notice.
 */
export function JsonViewer({ text }: { text: string }) {
  const { t } = useTranslation();
  const { formatted, valid } = useMemo(() => {
    try {
      return { formatted: JSON.stringify(JSON.parse(text), null, 2), valid: true };
    } catch {
      return { formatted: text, valid: false };
    }
  }, [text]);

  return (
    <div className="file-viewer-json">
      {valid ? null : (
        <div className="file-viewer-notice file-viewer-notice-warn">
          {t("workspace.fileViewer.invalidJson")}
        </div>
      )}
      <pre className="file-viewer-pre">{formatted}</pre>
    </div>
  );
}
