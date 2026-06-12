import assert from "node:assert/strict";
import test from "node:test";
import { resolveQrCanvasSize } from "../src/modules/dashboard/widgets/builtin/qr-code/qrSizing.ts";

test("QR canvas size fits the smaller stage dimension with padding", () => {
  assert.equal(resolveQrCanvasSize({ width: 500, height: 280, padding: 12 }), 256);
});

test("QR canvas size keeps a practical upper bound for roomy widgets", () => {
  assert.equal(resolveQrCanvasSize({ width: 800, height: 700, padding: 12 }), 360);
});
