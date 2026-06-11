import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("SFTP remote pane accepts Tauri file and folder drops as uploads", async () => {
  const source = await readFile(
    new URL("../src/modules/workspace/connections/sftp/SftpWorkspace.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /import \{ getCurrentWebview \} from "@tauri-apps\/api\/webview";/,
    "the SFTP workspace should listen for OS file drops through Tauri",
  );
  assert.match(
    source,
    /getCurrentWebview\(\)\.onDragDropEvent/,
    "remote-pane OS drops should use Tauri's drag/drop event stream",
  );
  assert.match(
    source,
    /isPositionOverRemotePane\(event\.payload\.position\.x,\s*event\.payload\.position\.y\)/,
    "dropped paths should upload only when the cursor is over the remote pane",
  );
  assert.match(
    source,
    /enqueueDroppedLocalPathsRef\.current\(event\.payload\.paths\)/,
    "external dropped file and folder paths should queue uploads directly",
  );
});
