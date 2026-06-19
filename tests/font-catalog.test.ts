import assert from "node:assert/strict";
import test from "node:test";

import {
  getRecommendedFontOptions,
  refreshSharedFontCatalog,
  subscribeSystemFontCatalog,
  systemFontCatalogSnapshot,
} from "../src/lib/fontCatalog.ts";

test("recommended font options follow the current platform", () => {
  const macUi = getRecommendedFontOptions("app-ui", "macos").map((option) => option.family);
  const macTerminal = getRecommendedFontOptions("terminal", "macos").map((option) => option.family);
  const linuxUi = getRecommendedFontOptions("app-ui", "linux").map((option) => option.family);
  const linuxTerminal = getRecommendedFontOptions("terminal", "linux").map((option) => option.family);

  assert.deepEqual(macUi, [undefined, "Inter", "SF Pro Text", "Helvetica Neue"]);
  assert.deepEqual(macTerminal, [undefined, "SF Mono", "Menlo", "JetBrains Mono", "Fira Code"]);
  assert.deepEqual(linuxUi, [undefined, "Inter", "Adwaita Sans", "Ubuntu Sans", "Cantarell", "Noto Sans"]);
  assert.deepEqual(linuxTerminal, [
    undefined,
    "JetBrains Mono",
    "Adwaita Mono",
    "Ubuntu Mono",
    "Fira Code",
    "Source Code Pro",
    "DejaVu Sans Mono",
  ]);
});

test("bundled JetBrains Mono survives terminal recommendation pruning", () => {
  // Even when no system terminal fonts are detected, the bundled mono must stay.
  const options = getRecommendedFontOptions("terminal", "macos", ["Some Unrelated Font"]);

  assert.deepEqual(options.map((option) => option.family), [undefined, "JetBrains Mono"]);
});

test("known system fonts prune unavailable recommendations but preserve defaults and bundled Inter", () => {
  const options = getRecommendedFontOptions("app-ui", "linux", ["Ubuntu Sans"]);

  assert.deepEqual(options.map((option) => option.family), [undefined, "Inter", "Ubuntu Sans"]);
});

test("one refresh publishes system and custom fonts to every subscriber", async () => {
  let notifications = 0;
  assert.equal(systemFontCatalogSnapshot().recommendationsSynced, false);
  const unsubscribeA = subscribeSystemFontCatalog(() => notifications += 1);
  const unsubscribeB = subscribeSystemFontCatalog(() => notifications += 1);

  try {
    await refreshSharedFontCatalog(
      async () => [
        { family: "SF Mono", isMonospace: true },
        { family: "Menlo", isMonospace: true },
      ],
      async () => [{
        cssFamily: "kkterm-custom-test",
        cssValue: '"kkterm-custom-test", "Test Font", sans-serif',
        faces: [{
          extension: "otf",
          family: "Test Font",
          isMonospace: false,
          name: "TestFont-Regular",
          path: "C:/fonts/TestFont.otf",
          style: "normal",
          weight: 400,
        }],
        isMonospace: false,
        name: "Test Font",
        path: "C:/fonts/TestFont.otf",
      }],
    );
    assert.deepEqual(systemFontCatalogSnapshot().systemFonts, [
      { family: "SF Mono", isMonospace: true },
      { family: "Menlo", isMonospace: true },
    ]);
    assert.deepEqual(systemFontCatalogSnapshot().customFonts.map((font) => font.name), ["Test Font"]);
    assert.equal(systemFontCatalogSnapshot().refreshing, false);
    assert.equal(systemFontCatalogSnapshot().recommendationsSynced, true);
    assert.equal(notifications, 4);
  } finally {
    unsubscribeA();
    unsubscribeB();
  }
});
