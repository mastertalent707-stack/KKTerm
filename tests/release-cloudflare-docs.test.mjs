import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("release and manual docs describe the Cloudflare mirror contract", async () => {
  const [architecture, release, manual] = await Promise.all([
    readFile(new URL("../docs/ARCHITECTURE.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/RELEASE.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/manual/15-settings.md", import.meta.url), "utf8"),
  ]);
  for (const value of [architecture, release, manual]) {
    assert.match(value, /kkterm\.ryantsai\.com/);
    assert.match(value, /GitHub.*fallback|fallback.*GitHub/is);
  }
  assert.match(release, /kkterm-releases/);
  assert.match(release, /CLOUDFLARE_ACCOUNT_ID/);
  assert.match(release, /CLOUDFLARE_API_TOKEN/);
  assert.match(release, /mirror-release\.yml/);
  assert.match(release, /macOS.*Linux.*stagger/is);
});
