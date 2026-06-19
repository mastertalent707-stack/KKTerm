import assert from "node:assert/strict";
import test from "node:test";

import {
  fontFaceDescriptors,
  notifyCustomFontsLoaded,
  toCustomFontOptions,
} from "../src/lib/customFonts.ts";
import type { CustomFont } from "../src/types.ts";

function face(overrides: Partial<CustomFont>): CustomFont {
  return {
    name: "MesloLGMNerdFontMono-Regular",
    family: "MesloLGM Nerd Font Mono",
    path: "C:/fonts/MesloLGMNerdFontMono-Regular.ttf",
    extension: "ttf",
    weight: 400,
    style: "normal",
    isMonospace: true,
    ...overrides,
  };
}

test("custom font files are grouped by internal family with partial faces allowed", () => {
  const options = toCustomFontOptions([
    face({}),
    face({
      name: "MesloLGMNerdFontMono-Bold",
      path: "C:/fonts/MesloLGMNerdFontMono-Bold.ttf",
      weight: 700,
    }),
  ]);

  assert.equal(options.length, 1);
  assert.equal(options[0].name, "MesloLGM Nerd Font Mono");
  assert.equal(options[0].isMonospace, true);
  assert.deepEqual(options[0].faces.map((item) => item.weight), [400, 700]);
});

test("normal, mono, and proportional variants remain separate families", () => {
  const options = toCustomFontOptions([
    face({ family: "MesloLGM Nerd Font" }),
    face({ family: "MesloLGM Nerd Font Mono" }),
    face({ family: "MesloLGM Nerd Font Propo" }),
  ]);

  assert.deepEqual(options.map((option) => option.name), [
    "MesloLGM Nerd Font",
    "MesloLGM Nerd Font Mono",
    "MesloLGM Nerd Font Propo",
  ]);
});

test("font faces carry their available weight and style descriptors", () => {
  assert.deepEqual(
    fontFaceDescriptors(face({ weight: 700, style: "italic" })),
    { display: "swap", style: "italic", weight: "700" },
  );
});

test("custom font completion emits an explicit renderer refresh event", () => {
  const target = new EventTarget();
  let notifications = 0;
  target.addEventListener("kkterm:custom-fonts-loaded", () => notifications += 1);

  notifyCustomFontsLoaded(target);

  assert.equal(notifications, 1);
});
