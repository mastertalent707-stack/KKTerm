import assert from "node:assert/strict";
import test from "node:test";
import {
  BRAND_ICON_ENTRIES,
  brandIconIdFromRef,
  brandIconRefForId,
  isKnownBrandIconId,
} from "../src/lib/brandIcons";

test("brand icon references round-trip only known ids", () => {
  assert.equal(brandIconRefForId("openai-codex"), "brand:openai-codex");
  assert.equal(brandIconIdFromRef("brand:openai-codex"), "openai-codex");
  assert.equal(brandIconIdFromRef("brand:not-real"), null);
  assert.equal(brandIconIdFromRef("os:ubuntu"), null);
  assert.equal(brandIconIdFromRef(null), null);
});

test("connection brand icon picker includes AI coding tools and terminal logos", () => {
  const ids = new Set(BRAND_ICON_ENTRIES.map((entry) => entry.id));

  for (const id of [
    "openai-codex",
    "claude-code",
    "opencode",
    "cursor",
    "github-copilot",
    "windsurf",
    "bash",
    "zsh",
    "fish",
    "powershell",
    "windows-terminal",
    "tmux",
  ]) {
    assert.ok(ids.has(id), `${id} should be available in the brand icon catalog`);
    assert.equal(isKnownBrandIconId(id), true);
  }
});
