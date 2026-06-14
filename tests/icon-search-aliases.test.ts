import assert from "node:assert/strict";
import test from "node:test";

import { searchMaterialIcons } from "../src/lib/iconCatalog.ts";
import { buildIconSearchGroups } from "../src/lib/iconSearchAliases.ts";

test("English (and unknown languages) keep one raw token per group", () => {
  assert.deepEqual(buildIconSearchGroups("folder server"), [["folder"], ["server"]]);
  assert.deepEqual(buildIconSearchGroups("folder server", "en"), [["folder"], ["server"]]);
});

test("localized words expand to the catalog's English keywords", () => {
  // Traditional Chinese "資料夾" => folder
  const zhTw = buildIconSearchGroups("資料夾", "zh-TW");
  assert.equal(zhTw.length, 1);
  assert.ok(zhTw[0].includes("folder"), "資料夾 should map to folder");

  // Spanish "carpeta" => folder
  assert.ok(buildIconSearchGroups("carpeta", "es")[0]?.includes("folder"));

  // Regional codes fall back to the base language (es-MX -> es).
  assert.ok(buildIconSearchGroups("carpeta", "es-MX")[0]?.includes("folder"));
});

test("material search finds icons by a localized query", () => {
  const englishHits = searchMaterialIcons("folder", 200);
  assert.ok(englishHits.length > 0, "sanity: folder matches in English");

  const localizedHits = searchMaterialIcons("資料夾", 200, "zh-TW");
  assert.ok(
    localizedHits.some((icon) => englishHits.some((hit) => hit.id === icon.id)),
    "Chinese 資料夾 should surface the same folder icons as English folder",
  );
});

test("unmapped localized text does not match everything", () => {
  // A token with no alias stays literal, so a nonsense string finds nothing.
  assert.equal(searchMaterialIcons("zzzznotarealicon", 50, "zh-TW").length, 0);
});
