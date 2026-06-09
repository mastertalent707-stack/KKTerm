# 08 — URL Connections

## AI grep hints

- Keys: `webview.*` (full namespace), `connections.embeddedWebApp`
- Topics: URL Connection, address bar, back/forward/reload, auto-refresh, credential fill, password capture, external open, saved Pane layout, Shift-click link, downloads, current external-browser fallback, tutorial targets `webview.toolbar`, `webview.address`, `webview.openExternally`, `webview.autoRefresh`, `webview.savePassword`, `webview.fillCredential`, `webview.sendToAi`, `webview.surface`
- Synonyms: "open a webpage", "embed a site", "browser tab", "internal web tool", "fill in saved password", "open link in browser", "external browser"

> **Term:** a **URL Connection** is a Connection of kind `url` storing one http(s) URL plus an optional `dataPartition` label. The `dataPartition` field is persisted but currently a no-op while embedded browsing is disabled.

## Surface

Current desktop behavior: embedded URL browsing is disabled. Opening a URL Connection validates the http(s) target and launches it in the OS default browser; the KKTerm Pane owns no child WebView2 surface and shows the disabled embedded-browser state instead of live page content.

This is intentional. The previous embedded browser depended on Tauri's `unstable` child-webview API. Enabling that feature changed the main KKTerm WebView2 host into a child HWND path, and Windows could restore focus to a native child/control instead of the terminal WebView2 content after Alt+Tab/app switch or minimize/restore. The visible terminal Pane could still look focused, but keyboard input did not reach xterm until the user clicked. KKTerm removed `unstable` and stubbed the URL child WebView2 path so terminal focus remains reliable.

If embedded URL browsing is reintroduced, verify in the real Windows Tauri runtime that a focused terminal Pane accepts keyboard input immediately after Alt+Tab/app switch and minimize/restore, and document any native child-window focus handling that becomes necessary. RDP remains the only workspace kind that uses screenshot-backed overlay parking.

Tutorial target: `webview.surface`.

## Toolbar

- Back: `webview.goBack` (`webview.back`)
- Forward: `webview.goForward` (`webview.forward`)
- Reload: `webview.reload`
- Address bar: `webview.address`, placeholder `webview.urlPlaceholder`. The bar accepts hosts without a scheme; the backend assumes `https://` when no scheme is present.
- Auto-refresh: `webview.autoRefresh` / `webview.autoRefreshOff`. Interval label `webview.autoRefreshSeconds`.
- Open externally: toolbar button `webview.openExternally` (opens the current URL in the OS default browser).
- Embedded page navigation, in-page link handling, credential fill, password capture, downloads, and URL Pane screenshots are inactive while the embedded backend is stubbed.
- When embedded browsing is restored, normal http(s) link clicks should navigate inside the URL Pane, including links that ask for a new browser window. Shift-click an http(s) link in the embedded page should open it in the OS default browser instead of navigating the URL Pane.
- Future embedded credential fill: `webview.fill` / `webview.fillCredential` / `webview.fillSavedCredential`.
- Future embedded password save: `webview.savePassword`, dialog title `webview.savePasswordTitle`.
- Future URL Pane screenshot-to-AI: `workspace.sendEntirePanelToAi` (tutorial target `webview.sendToAi`). Status Bar confirmation: `workspace.sentToAi`.
- Save/reset split Pane layout for a saved URL Connection from the Connection Tree right-click submenu `connections.layout` with `common.save` / `common.reset`.

Tutorial targets: `webview.toolbar`, `webview.address`, `webview.openExternally`, `webview.autoRefresh`, `webview.savePassword`, `webview.fillCredential`, `webview.sendToAi`.

## Credential fill

Credential fill is inactive while embedded browsing is stubbed. When embedded browsing is restored, KKTerm should be able to fill a saved username/password into the active form. Status lifecycle:

- `webview.fillingCredential` (in flight)
- `webview.credentialFilled` (success)
- `webview.noSavedCredential` (nothing stored for this Connection)

Saving a password from an in-page login form, once embedded browsing is restored:

- `webview.capturingPassword` → `webview.savingPassword` → `webview.passwordSaved`.
- Validation failures: `webview.savePasswordInvalidCapture`, `webview.savePasswordNoPasswordField`, `webview.savePasswordEmptyUsername`, `webview.savePasswordEmptyPassword`. Generic failure: `webview.savePasswordFailed`.

Saved credentials live in the OS keychain, never in SQLite. Manage stored credentials from Settings → Credentials ([15-settings.md](15-settings.md)).

## Downloads

Downloads are inactive while the embedded backend is stubbed. When embedded browsing is restored, the host WebView2 should emit download events and KKTerm should show transient status messages on the Status Bar:

- Started: `webview.downloadStarted`
- Complete: `webview.downloadComplete`
- Failed: `webview.downloadFailed`

## Empty / runtime states

- `webview.noUrlConfigured` — Connection has no URL set.
- `webview.onlyDesktopRuntime`, `webview.desktopRuntimeOnly` — shown in a non-Tauri runtime (Vite preview); the WebView2 surface is unavailable.
- Embedded-browser disabled state — shown in the desktop runtime while the URL child WebView2 backend is stubbed and URLs open externally.

## Screenshot target label

For [14-screenshots.md](14-screenshots.md): `webview.screenshotTarget`.
