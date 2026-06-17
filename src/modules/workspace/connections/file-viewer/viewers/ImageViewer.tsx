import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { fileExtension } from "../fileViewerModel";

const MIME_BY_TOKEN: Record<string, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  ico: "image/x-icon",
  avif: "image/avif",
  svg: "image/svg+xml",
};

/**
 * Renders an image from base64 bytes via a data URL. Web-native formats render
 * directly; an SVG loaded through `<img src>` cannot execute embedded scripts,
 * so this path is safe without extra sanitization.
 */
export function ImageViewer({
  base64,
  path,
  magic,
}: {
  base64: string;
  path: string;
  magic?: string | null;
}) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const mime = useMemo(() => {
    const token = magic ?? fileExtension(path);
    return MIME_BY_TOKEN[token] ?? "application/octet-stream";
  }, [magic, path]);
  const src = `data:${mime};base64,${base64}`;

  return (
    <div className="file-viewer-image">
      <div className="file-viewer-image-toolbar">
        <button
          className="toolbar-button"
          onClick={() => setZoom((value) => Math.max(0.1, value - 0.25))}
          type="button"
        >
          −
        </button>
        <span className="file-viewer-image-zoom">{Math.round(zoom * 100)}%</span>
        <button
          className="toolbar-button"
          onClick={() => setZoom((value) => Math.min(8, value + 0.25))}
          type="button"
        >
          +
        </button>
        <button className="toolbar-button" onClick={() => setZoom(1)} type="button">
          {t("common.reset")}
        </button>
      </div>
      <div className="file-viewer-image-canvas">
        <img
          alt={t("connections.fileView")}
          draggable={false}
          src={src}
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
    </div>
  );
}
