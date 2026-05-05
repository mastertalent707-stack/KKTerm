# Agent Instructions

## Project Shape

AdminDeck is a Windows-first, local-first Tauri v2 desktop app with a Rust backend and React/TypeScript frontend. The product direction lives in `docs/PRD.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, and `docs/ADR/`.

Before changing product behavior or terminology, read `CONTEXT.md` and preserve its domain boundaries.

## Domain Language

- **Connection**: durable, stored in SQLite. Supported kinds are local terminal, SSH terminal, URL (embedded WebView2), RDP, and VNC. SFTP is opened from an SSH Connection.
- **Quick Connect**: creates an unsaved one-off connection draft, then starts a session.
- **Session**: live process/channel/SFTP browser/webview state, not the saved profile itself.
- **Tab**: frontend workspace container, not a backend domain object.

Avoid using "profile" as the canonical name for stored openable resources. Use **Connection**.

## Engineering Defaults

- Prefer existing repo patterns over new abstractions.
- Keep backend data boundaries explicit: SQLite stores non-secret durable data, OS keychain stores secrets, and terminal contents are not logged by default.
- Keep Tauri command calls behind typed frontend wrappers in `src/lib/tauri.ts`.
- Keep the Settings surface in `src/settings/SettingsPage.tsx`; `src/App.tsx` should route to it and bootstrap settings, not own settings form/control code.
- Keep `src/App.tsx` limited to app shell routing, global panel layout, and bootstrap. Put connection-tree work in `src/connections/`, workspace dispatch/status/screenshot work in `src/workspace/`, terminal work in `src/terminal/`, SFTP work in `src/sftp/`, URL WebView work in `src/webview/`, remote desktop work in `src/remote-desktop/`, and assistant UI work in `src/ai/`.
- Do not put live session state into the durable connection model.
- Keep UI state such as tabs and selected panes in the frontend workspace layer unless there is a clear persistence requirement.
- For TSX accessibility attributes, use the typed helpers in `src/lib/aria.ts` for dynamic ARIA values so React emits valid values and source analyzers do not read JSX expressions as literal strings. Match ARIA roles to real children: `role="menu"` should contain menu items, while mixed popovers with forms/inputs should use a dialog-style surface instead.
- Avoid JSX `style=` for UI layout and theming when classes, data attributes, CSS variables, or ref-applied geometry can carry the state. Keep CSS compatibility warnings in mind: add vendor fallbacks where needed and avoid `color-mix()` in shared app CSS unless the target support is intentional.

## Internationalization (i18n)

AdminDeck uses **i18next** with **react-i18next** for UI translation. The architecture lives in `src/i18n/`.

### Architecture
- **`src/i18n/config.ts`** — i18next instance, language detection (localStorage `admindeck.language`), dynamic locale chunk loading via `import()`, `switchLanguage()`, and `ensureI18nReady()` for startup.
- **`src/i18n/useT.ts`** — typed `useT()` hook with full key autocompletion derived from the English locale JSON shape.
- **`src/i18n/locales/en.json`** — English source-of-truth with ~500 keys under 11 namespaces (`app`, `settings`, `connections`, `terminal`, `sftp`, `webview`, `remoteDesktop`, `ai`, `workspace`, `common`, `languages`).
- **`src/i18n/locales/<code>.json`** — 12 additional language files (fr, it, de, es, es-MX, pt-BR, zh-TW, zh-CN, ja, ko, th, id). Only English is bundled; other languages load on demand via dynamic `import()`.

### Supported languages
English (default), French, Italian, German, Spanish (Spain), Spanish (Mexico), Portuguese (Brazil), Chinese (Traditional), Chinese (Simplified), Japanese, Korean, Thai, Indonesian. Language selection persists in `localStorage` and survives app restarts.

### Language selector
Settings → General → Language dropdown. Calls `switchLanguage()` which persists the choice and hot-swaps the locale bundle.

### Rules for adding/changing UI strings
1. **Every user-visible string MUST go through `t()` or `useT()`.** Never hardcode English text in JSX, aria-labels, titles, placeholders, status messages, or error text.
2. **Add the new key to `src/i18n/locales/en.json` first**, under the appropriate namespace. Use nested dot-notation keys (e.g. `settings.general.language`).
3. **Add the key to every other locale file** under `src/i18n/locales/` with the translated value. Technical terms (SSH, SFTP, RDP, VNC, tmux, ProxyJump, PowerShell, WSL, API, URL) typically stay in English across all languages.
4. **Use `useTranslation` in React components** (`const { t } = useTranslation()`). For pure helper functions that cannot use hooks, import `i18next` from `src/i18n/config` and call `i18next.t(key)`.
5. **When renaming or removing a key**, update all 13 locale files so no stale keys remain.
6. **Keep the English file as the source of truth.** When adding a key, write the English value there and propagate translations outward.

### Namespace conventions
- `app` — App shell, ActivityRail, panel resize handles
- `settings` — Settings page sections, labels, status messages, form fields
- `connections` — Connection sidebar, tree, dialogs, Quick Connect, context menus
- `terminal` — Terminal workspace, toolbar, context menus, SSH host key dialogs
- `sftp` — SFTP browser, transfers, conflicts, properties
- `webview` — URL WebView toolbar, credential fill
- `remoteDesktop` — RDP/VNC workspace status, toolbar
- `ai` — AI Assistant panel, markdown toolbar, chat history, waiting phrases
- `workspace` — Tab strip, canvas empty state, status bar, screenshot menu
- `common` — Shared action labels (Save, Cancel, Close, Delete, Copy, etc.)
- `languages` — Native language names for the selector dropdown

## Checks

Run the relevant checks before handing work back:

```bash
npm run check
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

If a check cannot be run, explain why in the final response.
