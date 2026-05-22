import type { CaptureScreenshotRequest } from "../lib/tauri";

export function appViewportBounds() {
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
}

export function rectFromPoints(
  start: { x: number; y: number },
  current: { x: number; y: number },
): CaptureScreenshotRequest {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  return {
    x: Math.max(0, Math.round(x)),
    y: Math.max(0, Math.round(y)),
    width: Math.max(1, Math.round(Math.abs(current.x - start.x))),
    height: Math.max(1, Math.round(Math.abs(current.y - start.y))),
  };
}

export function pointInBounds(x: number, y: number, bounds: DOMRect) {
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
}

export function clampPointToBounds(x: number, y: number, bounds: DOMRect) {
  return {
    x: Math.min(Math.max(x, bounds.left), bounds.right),
    y: Math.min(Math.max(y, bounds.top), bounds.bottom),
  };
}

export async function waitForScreenshotSurface() {
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => window.setTimeout(resolve, 90));
}
