import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const urlSettings = readFileSync("src/modules/settings/UrlSettings.tsx", "utf8");
const credentialsSettings = readFileSync(
  "src/modules/settings/CredentialsSettings.tsx",
  "utf8",
);
const managerPath = "src/modules/settings/UrlCredentialManager.tsx";
const manager = existsSync(managerPath) ? readFileSync(managerPath, "utf8") : "";
const english = readFileSync("src/i18n/locales/en.json", "utf8");

test("URL and Credentials settings share one website-data manager", () => {
  assert.match(urlSettings, /<UrlCredentialManager/);
  assert.match(credentialsSettings, /<UrlCredentialManager/);
  assert.match(manager, /export function UrlCredentialManager/);
});

test("saved website data uses compact rows with the same edit and delete controls", () => {
  assert.match(manager, /className="settings-url-credential-row"/);
  assert.match(manager, /settings-url-credential-address/);
  assert.match(manager, /<Pencil/);
  assert.match(manager, /<Trash2/);
  assert.match(english, /"savedWebsitePasswords": "Saved website password\/input data"/);
});

test("website data editing uses a shared app-owned dialog instead of inline fields", () => {
  assert.match(manager, /<DialogShell>/);
  assert.match(manager, /<Sheet/);
  assert.match(manager, /<Actions/);
  assert.match(manager, /<Field/);
  assert.doesNotMatch(urlSettings, /settings-credential-edit/);
});
