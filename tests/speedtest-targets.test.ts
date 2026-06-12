import assert from "node:assert/strict";
import test from "node:test";
import {
  SPEEDTEST_TARGETS,
  buildSpeedtestDownloadUrl,
  buildSpeedtestLatencyUrl,
} from "../src/modules/dashboard/widgets/builtin/speedtest/speedtestRunner.ts";

test("speedtest exposes only CORS-safe Cloudflare browser targets", () => {
  assert.equal(SPEEDTEST_TARGETS[0]?.id, "cloudflare-auto");
  assert.deepEqual(
    SPEEDTEST_TARGETS.map((target) => target.kind),
    ["cloudflare"],
  );
});

test("speedtest URL builders use Cloudflare byte-sized requests", () => {
  const cloudflare = SPEEDTEST_TARGETS[0];
  assert.ok(cloudflare);

  const latencyUrl = buildSpeedtestLatencyUrl(cloudflare, 2, 12345);
  assert.equal(
    latencyUrl,
    "https://speed.cloudflare.com/__down?bytes=0&cacheBust=12345-2",
  );

  const downloadUrl = buildSpeedtestDownloadUrl(cloudflare, 5_000_000, 67890);
  assert.equal(
    downloadUrl,
    "https://speed.cloudflare.com/__down?bytes=5000000&cacheBust=67890",
  );
});
