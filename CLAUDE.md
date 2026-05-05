# Claude Instructions

Follow `AGENTS.md` for repository workflow and `CONTEXT.md` for product language.

## Frontend Module Boundaries

- `src/App.tsx` owns app shell routing, workspace composition, and startup/bootstrap effects.
- `src/settings/SettingsPage.tsx` owns Settings UI sections, settings draft state, save/reset handlers, and settings-specific helper controls.
- Keep typed Tauri calls behind `src/lib/tauri.ts`; do not call backend commands with ad hoc stringly wrappers from Settings or App code.

## Critical Domain Boundaries

- **Connection** is durable SQLite data for something the user can open, including local terminal, SSH terminal, URL, RDP, and VNC kinds.
- **Quick Connect** is an unsaved draft that starts a live session.
- **Session** is live runtime state for a local process, SSH channel, or SFTP browser.
- **Tab** is frontend workspace UI, not a backend domain object.

When discussing or changing the app, keep these concepts separate. If new terminology appears to conflict with `CONTEXT.md`, pause and resolve the term before implementing.
