import { useMemo } from "react";

/** Bytes per rendered hex row. */
const ROW_WIDTH = 16;

function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * Classic offset / hex / ASCII fallback view for binary or unknown files. Bytes
 * are already bounded by the backend read, so the whole returned chunk is laid
 * out in fixed-width rows.
 */
export function HexViewer({ base64 }: { base64: string }) {
  const rows = useMemo(() => {
    const bytes = decodeBase64(base64);
    const result: { offset: number; hex: string; ascii: string }[] = [];
    for (let start = 0; start < bytes.length; start += ROW_WIDTH) {
      const slice = bytes.subarray(start, start + ROW_WIDTH);
      const hex = Array.from(slice)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(" ");
      const ascii = Array.from(slice)
        .map((byte) => (byte >= 0x20 && byte < 0x7f ? String.fromCharCode(byte) : "."))
        .join("");
      result.push({ offset: start, hex, ascii });
    }
    return result;
  }, [base64]);

  return (
    <div className="file-viewer-hex">
      {rows.map((row) => (
        <div className="file-viewer-hex-row" key={row.offset}>
          <span className="file-viewer-hex-offset">
            {row.offset.toString(16).padStart(8, "0")}
          </span>
          <span className="file-viewer-hex-bytes">{row.hex}</span>
          <span className="file-viewer-hex-ascii">{row.ascii}</span>
        </div>
      ))}
    </div>
  );
}
