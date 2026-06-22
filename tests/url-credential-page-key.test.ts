import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUrlCredentialPageKey, urlCredentialSecretOwnerId } from "../src/modules/workspace/connections/webview/urlCredentialKeys";

test("URL credential page keys ignore ephemeral query and fragment data", () => {
  assert.equal(
    normalizeUrlCredentialPageKey("HTTPS://Example.com:443/login?state=one&nonce=two#callback"),
    "https://example.com/login",
  );
  assert.equal(
    normalizeUrlCredentialPageKey("https://example.com/login?state=three"),
    "https://example.com/login",
  );
  assert.equal(normalizeUrlCredentialPageKey("https://example.com"), "https://example.com/");
});

test("URL credential secret owners are stable and short per page key", () => {
  const first = urlCredentialSecretOwnerId("connection-1", "https://example.com/login?state=one");
  const second = urlCredentialSecretOwnerId("connection-1", "https://example.com/login?state=two");
  const otherPage = urlCredentialSecretOwnerId("connection-1", "https://example.com/password");

  assert.equal(first, second);
  assert.notEqual(first, otherPage);
  assert.ok(first.length <= 128);
  assert.match(first, /^url:connection-1:[0-9a-f]{16}$/);
});
