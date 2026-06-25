import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/modules/workspace/connections/ImportDialog.tsx", import.meta.url),
  "utf8",
);

test("bookmark import source discovery settles when no sources are found", () => {
  assert.match(
    source,
    /const \[bookmarksLoaded, setBookmarksLoaded\] = useState\(false\)/,
    "bookmark discovery needs an explicit loaded flag so an empty source list is stable",
  );
  assert.match(
    source,
    /source !== "bookmarks" \|\| bookmarksLoaded \|\| bookmarksLoading/,
    "bookmark discovery should be gated by loaded/loading state, not by source count",
  );
  assert.doesNotMatch(
    source,
    /source !== "bookmarks" \|\| bookmarkSources\.length > 0 \|\| bookmarksLoading/,
    "an empty bookmark source list must not retrigger discovery forever",
  );
  assert.match(
    source,
    /setBookmarksLoaded\(true\);/,
    "bookmark discovery should mark both success and failure paths as settled",
  );
});
