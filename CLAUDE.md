# Claude Instructions

Follow `AGENTS.md` for repository workflow and `CONTEXT.md` for product language.

## Internationalization (i18n)

AdminDeck uses **i18next + react-i18next**. The i18n module lives in `src/i18n/`.

- **English is the source of truth**: `src/i18n/locales/en.json` defines every key. All other locale files mirror the same structure.
- **All user-visible text must pass through `t()`**: labels, aria-labels, titles, placeholders, status messages, error text, confirmation prompts. Never write bare English strings in JSX.
- **In React components**, use `const { t } = useTranslation()` from `react-i18next`.
- **In pure functions that cannot use hooks**, import the default `i18next` instance from `src/i18n/config` and call `i18next.t("key")`.
- **Add new keys to `en.json` first**, then propagate to the other 12 locale files (`fr`, `it`, `de`, `es`, `es-MX`, `pt-BR`, `zh-TW`, `zh-CN`, `ja`, `ko`, `th`, `id`).
- **When a key is renamed or removed**, update all 13 files to keep them in sync. Stale keys cause no runtime error (fallback to English) but clutter the locale files.
- **Language switching** is handled by `switchLanguage()` in `src/i18n/config.ts`. The selected language persists in `localStorage` under `admindeck.language`.
- **Dynamic locale loading**: only English is bundled; other languages load on demand via dynamic `import()`. Vite automatically code-splits each locale into its own chunk.

## Frontend Module Boundaries

- `src/App.tsx` owns app shell routing, global panel layout, Settings routing, the activity rail, and startup/bootstrap effects. It should not grow workspace surface, connection-tree, assistant, or Settings form code.
- Workspace and feature surfaces are extracted: `src/connections/`, `src/workspace/`, `src/terminal/TerminalWorkspace.tsx`, `src/sftp/SftpWorkspace.tsx`, `src/webview/WebViewWorkspace.tsx`, `src/remote-desktop/RemoteDesktopWorkspace.tsx`, and `src/ai/AssistantPanel.tsx`. See `docs/ARCHITECTURE.md` "Frontend Module Map" before placing new UI or helper logic.
- `src/settings/SettingsPage.tsx` owns Settings UI sections, settings draft state, save/reset handlers, and settings-specific helper controls.
- `src/lib/settings.ts` owns the persisted-settings bootstrap into the workspace store (`useBootstrapSettings`) and the `AI_PROVIDER_SECRET_OWNER_ID` keychain owner constant. Add new persisted settings here rather than cloning a `useEffect` in `App.tsx`.
- Keep typed Tauri calls behind `src/lib/tauri.ts`; do not call backend commands with ad hoc stringly wrappers from Settings or App code.
- For dynamic ARIA in TSX, prefer the helpers in `src/lib/aria.ts` and spread their results onto elements. Do not put controls or forms inside `role="menu"` containers; use menu roles only for true menu/menuitem structures and dialog-style popovers for mixed content.
- Avoid JSX `style=` for app UI when CSS/data attributes or ref-applied geometry can carry the state. Keep shared CSS compatible with the desktop WebView target and avoid unsupported features such as `color-mix()` unless there is an intentional fallback.

## Critical Domain Boundaries

- **Connection** is durable SQLite data for something the user can open, including local terminal, SSH terminal, URL, RDP, and VNC kinds.
- **Quick Connect** is an unsaved draft that starts a live session.
- **Session** is live runtime state for a local process, SSH channel, or SFTP browser.
- **Tab** is frontend workspace UI, not a backend domain object.

When discussing or changing the app, keep these concepts separate. If new terminology appears to conflict with `CONTEXT.md`, pause and resolve the term before implementing.
