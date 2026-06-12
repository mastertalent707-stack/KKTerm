const MAX_QR_CANVAS_SIZE = 360;
const MIN_QR_CANVAS_SIZE = 96;

interface QrCanvasBounds {
  width: number;
  height: number;
  padding: number;
}

export function resolveQrCanvasSize(bounds: QrCanvasBounds): number {
  const available = Math.min(bounds.width, bounds.height) - bounds.padding * 2;
  if (!Number.isFinite(available) || available <= 0) return MAX_QR_CANVAS_SIZE;
  return Math.max(MIN_QR_CANVAS_SIZE, Math.min(MAX_QR_CANVAS_SIZE, Math.floor(available)));
}
