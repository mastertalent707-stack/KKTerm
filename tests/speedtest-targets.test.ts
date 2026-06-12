import assert from "node:assert/strict";
import test from "node:test";
import {
  SPEEDTEST_TARGETS,
  buildSpeedtestDownloadUrl,
  buildSpeedtestLatencyUrl,
} from "../src/modules/dashboard/widgets/builtin/speedtest/speedtestRunner.ts";

test("speedtest targets include tested CORS-safe regional choices and keep Cloudflare as the default", () => {
  assert.equal(SPEEDTEST_TARGETS[0]?.id, "cloudflare-auto");
  assert.ok(SPEEDTEST_TARGETS.some((target) => target.id === "librespeed-new-york"));
  assert.ok(SPEEDTEST_TARGETS.some((target) => target.id === "librespeed-los-angeles"));
  assert.ok(SPEEDTEST_TARGETS.some((target) => target.id === "librespeed-london"));
  assert.ok(SPEEDTEST_TARGETS.some((target) => target.id === "librespeed-frankfurt"));
  assert.ok(SPEEDTEST_TARGETS.some((target) => target.id === "librespeed-tokyo"));
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

test("LibreSpeed URL builders request documented CORS-enabled endpoints", () => {
  const tokyo = SPEEDTEST_TARGETS.find((target) => target.id === "librespeed-tokyo");
  assert.ok(tokyo);

  const latencyUrl = buildSpeedtestLatencyUrl(tokyo, 2, 12345);
  assert.equal(
    latencyUrl,
    "https://librespeed.a573.net/backend/empty.php?cors=true&cacheBust=12345-2",
  );

  const downloadUrl = buildSpeedtestDownloadUrl(tokyo, 5_000_000, 67890);
  assert.equal(
    downloadUrl,
    "https://librespeed.a573.net/backend/garbage.php?ckSize=5&cors=true&cacheBust=67890",
  );
});
