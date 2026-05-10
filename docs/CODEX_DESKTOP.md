# Codex Desktop UI Review

Use this workflow when Codex Desktop needs the built-in browser to inspect and comment on KKTerm UI fixes.

## Start the Browser Target

```bash
npm run codex:ui
```

The helper starts the Vite frontend on the fixed KKTerm/Tauri dev port and reuses it if it is already running:

```text
http://localhost:1420
```

Runtime logs are written under `.agents/logs/`, which is intentionally ignored by git.

## Built-In Browser Loop

1. Open `http://localhost:1420` in the Codex Desktop built-in browser.
2. Use browser screenshots and DOM inspection for layout, spacing, overflow, focus, tooltip, dialog, and i18n-key coverage review.
3. After each UI edit, reload the built-in browser tab before taking the next screenshot.
4. For native-only behavior such as local terminal focus, Windows ConPTY input, RDP ActiveX, WebView2, or title-bar close behavior, validate in the real Tauri desktop runtime instead of the browser preview.

## Desktop Runtime Check

Use this when the change depends on Tauri, native windows, local PTY behavior, WebView2, RDP, VNC, keychain, filesystem dialogs, or OS integration:

```bash
npm run tauri dev
```

Keep frontend-only review in the built-in browser, and switch to the desktop runtime when the behavior crosses the native boundary.
