import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPingSummary,
  summarizePingReplies,
  parsePingTargets,
} from "../src/modules/dashboard/widgets/builtin/ping-tool/pingTool";

test("parsePingTargets extracts plain IPv4 addresses from pasted text", () => {
  const parsed = parsePingTargets("core=192.168.1.10, backup 10.0.0.5\n192.168.1.10");

  assert.deepEqual(parsed.targets.map((target) => target.host), [
    "192.168.1.10",
    "10.0.0.5",
  ]);
  assert.equal(parsed.truncated, false);
});

test("parsePingTargets expands small CIDR blocks and caps large pastes", () => {
  const parsed = parsePingTargets("192.168.2.0/30\n10.0.0.0/24", 4);

  assert.deepEqual(parsed.targets.map((target) => target.host), [
    "192.168.2.1",
    "192.168.2.2",
    "10.0.0.1",
    "10.0.0.2",
  ]);
  assert.equal(parsed.truncated, true);
});

test("summarizePingReplies reports current, average, and packet loss", () => {
  const summary = summarizePingReplies([
    { seq: 0, ok: true, rttMs: 12 },
    { seq: 1, ok: false },
    { seq: 2, ok: true, rttMs: 18 },
  ]);

  assert.equal(summary.sent, 3);
  assert.equal(summary.received, 2);
  assert.equal(summary.currentMs, 18);
  assert.equal(summary.averageMs, 15);
  assert.equal(summary.packetLossPercent, 33.333333333333336);
  assert.equal(formatPingSummary(summary), "18 ms now · 15 ms avg · 33.3% loss");
});
