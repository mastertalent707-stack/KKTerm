import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("RDP Tabs auto-close from the ActiveX disconnect event instead of polling", async () => {
  const remoteDesktopSource = await readFile(
    new URL("../src/modules/workspace/connections/remote-desktop/RemoteDesktopWorkspace.tsx", import.meta.url),
    "utf8",
  );
  const rdpSource = await readFile(new URL("../src-tauri/src/rdp.rs", import.meta.url), "utf8");

  assert.match(
    remoteDesktopSource,
    /const closeTab = useWorkspaceStore\(\(state\) => state\.closeTab\);/,
    "RDP workspace should be able to close its owning Tab",
  );
  assert.doesNotMatch(
    remoteDesktopSource,
    /get_rdp_session_status/,
    "RDP disconnect detection should not poll session status",
  );
  assert.match(
    remoteDesktopSource,
    /listen<RdpSessionEvent>\("rdp-session-event"[\s\S]*closeRdpTabAfterRemoteDisconnect\(\)/,
    "RDP workspace should close the owning Tab from the backend disconnect event",
  );
  assert.match(
    remoteDesktopSource,
    /const closeRdpTabAfterRemoteDisconnect = \(\) => \{[\s\S]*closeTab\(tab\.id\);[\s\S]*\};/,
    "remote disconnect handling should close the current RDP Tab unconditionally",
  );
  assert.match(
    rdpSource,
    /const DISPID_DISCONNECTED: i32 = 4;/,
    "Rust event sink should recognize IMsTscAxEvents::OnDisconnected",
  );
  assert.match(
    rdpSource,
    /FindConnectionPoint\(&IID_IMS_TSC_AX_EVENTS/,
    "RDP ActiveX host should subscribe to IMsTscAxEvents through a COM connection point",
  );
  assert.match(
    rdpSource,
    /emit_rdp_session_event\([\s\S]*RdpSessionEvent::Disconnected/,
    "RDP ActiveX disconnect events should be emitted to the frontend",
  );
});
