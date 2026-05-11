# Dashboard Redesign — Design Spec

**Date:** 2026-05-11
**Status:** Approved
**Architecture reference:** `docs/DASHBOARD.md`

## Purpose

Redesign the KKTerm Dashboard module around a three-kind widget system (`builtIn`, `content`, `script`) placed on a 12-column drag-and-drop grid, with per-widget visual customization (preset, accent, icon, title) and SQLite-backed persistence. The redesign establishes the abstraction layer that lets the AI Assistant create, modify, and remove widgets through atomic Tauri commands.

This is the foundation for future widget work. Only the App Launcher widget gets full polish in this PR; the other four legacy built-ins (hash, subnet, quick tools, maintenance report) render through the new chrome but keep their existing bodies, slated for follow-up redesign.

## Goals

1. Replace the current monolithic `DashboardPage.tsx` with a small registry-driven architecture so adding a new widget = one body file + one registry row.
2. Give each widget instance four customization axes: visual preset, accent color, icon, and title.
3. Free-position layout (drag, resize, snap-to-grid) via `react-grid-layout`.
4. Move dashboard state from `localStorage` to SQLite using three relational tables, so the AI Assistant can manipulate widgets through atomic per-row commands.
5. Allow AI-authored widgets to range from declarative content (markdown, key/value lists, checklists, stats) to actual JavaScript executed inside an isolated `iframe srcdoc` host with optional network access and periodic polling.
6. Respect KKTerm's existing 11-scheme color system for dashboard chrome; per-widget accent stays independent of the active scheme.
7. Add a small Settings → Dashboard section for cross-widget app preferences, with the destructive "Reset Dashboard" action in General → Settings data.

## Non-goals

1. Redesign of legacy widget bodies (hash, subnet, quick tools, report). They render in the new chrome only.
2. New native data widgets from the mockup (Weather, Clock, CPU, Memory, Recent Hosts, Session Activity, Today's Brief). Deferred — they need new Tauri data sources.
3. User-facing "Create custom widget" dialog. AI-only authorship in this PR.
4. Monaco-quality script editor. The Advanced section shows source as read-only.
5. Cross-view drag of widget instances. A drag stays within the active view.
6. App-wide theme picker changes. The existing AppearanceSettings flow is untouched.
7. Multi-user sync. KKTerm is local-first and single-user.

## Domain model

### `DashboardView`
| Field | Type | Notes |
|---|---|---|
| `id` | TEXT PK | stable identifier |
| `title` | TEXT | shown in the topbar pill |
| `sort_order` | INTEGER | order among views |
| `grid_density` | TEXT | `'compact'` \| `'default'` \| `'roomy'`. Per-view. Editable in edit mode only. |

### `DashboardWidgetInstance`
A placed widget on a view. Multiple instances of the same source can coexist (different presets, accents, sizes).

| Field | Type | Notes |
|---|---|---|
| `id` | TEXT PK | instance uid |
| `view_id` | TEXT FK → `dashboard_views.id` CASCADE | |
| `kind` | TEXT | `'builtIn'` \| `'content'` \| `'script'` |
| `source_id` | TEXT | built-in registry id (when `kind='builtIn'`) or custom widget id |
| `preset` | TEXT | one of nine preset names |
| `accent_name` | TEXT | palette name (not hex) |
| `icon_name` | TEXT | lucide icon name from the curated whitelist |
| `custom_title` | TEXT NULL | null → fall back to source title |
| `grid_x`, `grid_y`, `grid_w`, `grid_h` | INTEGER | react-grid-layout coords |
| `sort_order` | INTEGER | tiebreaker for identical `grid_y` |

### `DashboardCustomWidget`
Durable definition for `content` and `script` widgets created by the AI Assistant. Not used for `builtIn` widgets.

| Field | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `kind` | TEXT | `'content'` \| `'script'` |
| `title` | TEXT | source title |
| `summary` | TEXT | catalog summary |
| `category` | TEXT | catalog grouping |
| `body_json` | TEXT | validated JSON, shape depends on `kind` |
| `created_by` | TEXT | `'user'` \| `'agent'` |
| `created_at`, `updated_at` | TEXT | timestamps |

`body_json` for `kind='content'`:
```jsonc
{ "shape": "markdown" | "kvList" | "checklist" | "stat", "data": { /* shape-specific */ } }
```

`body_json` for `kind='script'`:
```jsonc
{
  "source": "...JS module body...",
  "permissions": { "network": true, "pollSeconds": 60 },
  "htmlShim": "..." // optional <body> markup; default is a single div the script attaches to
}
```

### Cascade behavior

- Delete a view → all its widget instances are removed (FK CASCADE).
- Delete a custom widget → all instances pointing at it must be removed first (enforced in Rust; SQLite cannot express conditional FKs). If instances exist, the command returns a structured error listing affected instances; the caller (user or AI) must confirm.

## Frontend architecture

### Module layout

```
src/dashboard/
  DashboardPage.tsx              — shell, view pills, topbar, edit-mode toggle (~150 lines)
  state/
    dashboardStore.ts            — Zustand store (views, instances, customWidgets, activeViewId, editMode)
    persistence.ts               — typed Tauri command wrappers
  registry/
    builtInRegistry.ts           — Map<string, BuiltInWidgetEntry>
    presetRegistry.ts            — nine preset chrome components (Panel, Ambient, Glass, Tile, Hero, Mono, Stack, Action, Band)
    palette.ts                   — accent palette + icon whitelist (~50 lucide icons)
  view/
    DashboardCanvas.tsx          — RGL grid host, drag/resize wiring
    WidgetFrame.tsx              — preset chrome + edit-mode controls (X / settings)
    WidgetBody.tsx               — dispatch by kind → builtIn / content / script renderer
  widgets/                       — built-in body components (one file each)
    AppLauncherBody.tsx          — delegates to existing src/app-launcher
    HashBody.tsx                 — legacy (slated for redesign)
    SubnetBody.tsx               — legacy
    QuickToolsBody.tsx           — legacy
    ReportBody.tsx               — legacy
  content/
    ContentWidgetRenderer.tsx    — switch over shape: markdown / kvList / checklist / stat
  script/
    ScriptWidgetHost.tsx         — iframe srcdoc + postMessage bridge
    permissions.ts               — capability validation
  edit/
    CatalogOverlay.tsx           — "Add widget" modal
    CustomizePopover.tsx         — preset / accent / icon / title + Advanced
  motion.tsx                     — existing; kept
```

Adding a new built-in widget = drop a `Body` file in `widgets/` and one row in `builtInRegistry.ts`. There are no switch statements outside the registries.

### Built-in registry shape

```ts
export interface BuiltInWidgetEntry {
  id: string;                       // stable; used as DashboardWidgetInstance.source_id
  titleKey: string;                 // i18n key
  summaryKey: string;
  category: string;
  defaultPreset: WidgetPreset;
  defaultAccent: PaletteName;
  defaultIcon: LucideIconName;
  defaultSize: { w: number; h: number };
  Body: React.ComponentType;
}
```

### State management

Zustand store (`useDashboardStore`) holds all view/instance/custom-widget state and `editMode` boolean. Each mutator calls the matching Tauri command and updates local state on success. Layout writes during drag/resize are debounced to ~300 ms via a single batched `dashboard_apply_layout` call. If a write fails, local state rolls back and the workspace status bar surfaces a retry notice (per AGENTS.md transient-status rules).

The store exposes a compact read-projection for the AI Assistant's `onAssistantContextChange` payload: `{ activeView, instances: [...], customWidgets: [...] }`. The assistant sees what's on the dashboard without issuing a tool call.

### Preset chrome (nine presets)

Each preset is a thin wrapper that frames `WidgetBody` differently. Presets are pure CSS + a small component; they read `--w-accent` and `--w-accent-soft` CSS variables that `WidgetFrame` sets inline based on the widget's `accent_name`. The nine presets, kept identical to the design mockup:

| Preset | Purpose |
|---|---|
| `panel` | Window-style chrome with header strip + icon + title. Default for forms/reports. |
| `ambient` | No chrome. Sits flat on the canvas. macOS widget feel. |
| `glass` | Frosted ambient with backdrop blur. |
| `tile` | Compact stat card with big number. |
| `hero` | Accent-colored solid background, attention-grabbing. |
| `mono` | Terminal aesthetic (mono font, terminal traffic lights). |
| `stack` | Tight list of key/value rows. |
| `action` | Single CTA button. For shortcuts/launchers. |
| `band` | Slim full-width banner. For notices. Always 12-col wide. |

### Drag handle

In edit mode, only the preset's header strip is a drag handle (`.drag-handle` class). Presets without a natural header (`ambient`, `band`) get a small invisible 12 px strip at the top edge. This keeps interactive content inside the widget (textareas, inputs, list scrolling) clickable even during edit mode.

## Backend (SQLite + Tauri)

### Schema bump

`SCHEMA_USER_VERSION` 8 → 9. No migration logic. First-run after the bump drops any partial dashboard state and seeds:

- One `dashboard_views` row: `id='default'`, `title='Default'`, `sort_order=0`, `grid_density='default'`.
- One `dashboard_widget_instances` row: App Launcher built-in at `(x=0, y=0, w=4, h=3)` on the Default view with `preset='panel'`, `accent_name='blue'`, `icon_name='Wrench'`.

### Tables (added to `CURRENT_SCHEMA` in `src-tauri/src/storage.rs`)

```sql
CREATE TABLE IF NOT EXISTS dashboard_views (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    grid_density TEXT NOT NULL DEFAULT 'default'
        CHECK (grid_density IN ('compact', 'default', 'roomy'))
);

CREATE TABLE IF NOT EXISTS dashboard_custom_widgets (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('content', 'script')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'custom',
    body_json TEXT NOT NULL,
    created_by TEXT NOT NULL CHECK (created_by IN ('user', 'agent')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_widget_instances (
    id TEXT PRIMARY KEY,
    view_id TEXT NOT NULL REFERENCES dashboard_views(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('builtIn', 'content', 'script')),
    source_id TEXT NOT NULL,
    preset TEXT NOT NULL,
    accent_name TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    custom_title TEXT,
    grid_x INTEGER NOT NULL,
    grid_y INTEGER NOT NULL,
    grid_w INTEGER NOT NULL,
    grid_h INTEGER NOT NULL,
    sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widget_instances_view
    ON dashboard_widget_instances(view_id, sort_order);
```

### Tauri commands

Implemented in a new `src-tauri/src/dashboard_commands.rs` (or appended to `commands.rs` if small). All shapes are camelCase at the IPC boundary, snake_case in SQL.

| Command | Purpose |
|---|---|
| `dashboard_load_state` | Single batched read on mount: `{ views, instances, customWidgets }` |
| `dashboard_create_view(title, gridDensity?)` | Returns the new view |
| `dashboard_update_view(id, patch: { title?, gridDensity?, sortOrder? })` | Single replacement for the old "rename" command |
| `dashboard_remove_view(id)` | Hard delete; cascades to instances |
| `dashboard_reorder_views(orderedIds)` | Re-sorts |
| `dashboard_add_instance(viewId, kind, sourceId, preset, accentName, iconName, x, y, w, h)` | Returns the new instance |
| `dashboard_update_instance(id, patch)` | Patch shape mirrors instance fields except `id` and `view_id` |
| `dashboard_remove_instance(id)` | Hard delete |
| `dashboard_apply_layout(viewId, layout: Vec<{id, x, y, w, h}>)` | Batched commit used by the debounced drag/resize flow |
| `dashboard_create_custom_widget(kind, title, summary, category, bodyJson, createdBy)` | Validates `bodyJson` per kind |
| `dashboard_update_custom_widget(id, patch)` | |
| `dashboard_remove_custom_widget(id, forceDeleteInstances: bool)` | When `false` and instances exist, returns a structured error listing them |

### Validation in Rust

Every command runs a validator before touching the DB. `body_json` for custom widgets is parsed into a typed Rust enum (serde-tagged on `shape` for content, on object presence of `source` for script). Validation failures return `{ ok: false, reason: "...", details: "..." }` the AI Assistant can surface to the user. Invariants enforced:

- `preset` is one of the nine known names.
- `accent_name` is in the palette whitelist.
- `icon_name` is in the curated lucide icon whitelist (~50 names).
- `grid_w` ≥ 1, `grid_h` ≥ 1, `grid_x` ≥ 0, `grid_y` ≥ 0, and `grid_x + grid_w` ≤ 12.
- `content` body shapes match expected fields and byte-size caps.
- `script` source is ≤ 64 KB; `pollSeconds` is ≥ 1; `permissions` keys are from the known set.

## Edit mode UX

The "Edit layout" button toggles a single boolean on the store. In edit mode:

- RGL `isDraggable: true`, `isResizable: true`.
- Widgets show a dashed outline + a resize corner handle.
- `WidgetFrame` reveals X (remove) and ⚙ (customize) controls on hover.
- The topbar's "Edit layout" button reads "Done" with a distinct color.
- A `Compact / Default / Roomy` segmented control appears beside "Done", bound to the active view's `grid_density`.
- `Esc` exits edit mode.

Out of edit mode the canvas reads cleanly with no controls.

### Drag/resize → persistence pipeline

```
RGL onLayoutChange(newLayout)
  → useDashboardStore.applyLayout(viewId, newLayout)     // immediate local update
  → debounce 300 ms
  → dashboard_apply_layout(viewId, newLayout)            // single batched Tauri write
```

On write failure: local state rolls back and `showWorkspaceStatus` surfaces a retry notice. One automatic retry, then a manual retry button.

### Compaction

`compactType: 'vertical'`, `preventCollision: false`. Widgets fall up to fill gaps; dragging onto another widget pushes per RGL's normal behavior. Standard dashboard feel.

## Customize popover

Anchored to the widget's ⚙ button. Sections, top to bottom:

1. **Style Preset** — row of 9 chips. Click to apply instantly.
2. **Accent** — palette swatches (~14 named colors). Click to apply.
3. **Icon** — open scrollable grid of ~50 curated lucide icons.
4. **Title** — text input, `onBlur` commit. Empty clears `custom_title`.
5. **Advanced (collapsible, default collapsed)** — kind-specific:
   - `script`: network permission toggle, poll-seconds number input, "View source" read-only modal, "Reload" iframe button.
   - `content`: "View body JSON" read-only block.
   - `builtIn`: nothing extra.

The four shared sections render identically regardless of widget kind. The customization story is uniform.

## Catalog overlay

"Add widget" button → modal with search + category tabs + thumbnail cards. Cards show:

- Style thumb (mini preview of the default preset rendering).
- Title, summary.
- "Already added" hint if an instance exists on the active view (visual only; duplicates allowed).
- "Agent" badge if the widget was AI-created.

Categories derive from the built-in registry + custom widgets, plus "All". Custom widgets get a "Custom" tab.

**No user-facing "+ Create custom widget" entry.** Authoring custom widgets is AI-only in this PR.

## Script widget host

`ScriptWidgetHost.tsx` renders an `<iframe srcdoc="...">` containing:

- A `<style>` block carrying KKTerm's accent/text/border variables (so the script can use them).
- An optional `htmlShim` (user-provided body markup) — default is a single `<div id="root">`.
- A `<script>` block that runs the user/agent source string in module scope. The source has access to `document`, `fetch`, `setInterval`, `setTimeout`, `console`, and a `KK` global with safe parent-bridge helpers (initially: `KK.requestPermission`, `KK.postMessage`).

A postMessage bridge between host and iframe is wired up at mount; the contract is intentionally minimal in v1. Future Tauri-command access is added by extending this bridge with explicit handlers — not by widening the iframe's globals.

The host enforces declared permissions:

- `permissions.network` — when `false`, the iframe's CSP blocks `connect-src` (`fetch`, XHR, WebSocket all fail).
- `permissions.pollSeconds` — informational; the script self-schedules. The host could enforce a minimum floor in a follow-up.

The iframe is a **fault-isolation** boundary, not a security boundary. A typo in one script widget cannot crash the dashboard.

## AI Assistant integration

Each `dashboard_*` Tauri command is registered as an assistant tool with a JSON schema in the assistant tool registry. The existing approval flow gates execution (per CONTEXT.md: "Keep command execution approval-based").

Read context — when the Dashboard page is active, `onAssistantContextChange` includes a compact snapshot:

```ts
{
  page: "dashboard",
  activeView: { id, title, gridDensity },
  instances: [{ id, kind, sourceId, customTitle, preset, x, y, w, h }],
  customWidgets: [{ id, kind, title }],
}
```

The AI sees what's on screen without an extra tool call. The assistant can answer "what's on my dashboard?" directly and propose precise diffs.

Validation errors from Rust come back to the assistant with structured `{ ok: false, reason, details }` shapes so the AI can self-correct on retry.

**Polish of the assistant UX (prompt tuning, example flows, "AI suggested a widget" affordances) is out of scope for this PR.** Plumbing only; UX iteration follows.

## Settings → Dashboard

New `dashboard-settings` section in `src/settings/SettingsPage.tsx`, navigation entry between Appearance and AI Assistant. Uses the shared `settings-subsection settings-fieldset` style (AGENTS.md rule).

| Setting | Default | Storage |
|---|---|---|
| Confirm before removing a widget | on | `settings` table key `dashboard.confirmRemove` |
| Default landing view | Last active | `settings` table key `dashboard.defaultLandingView` = `"lastActive"` or a view id |

**Grid density is per-view, not in Settings.** It lives on the view row and is edited from the edit-mode topbar.

**Destructive "Reset Dashboard" action goes in General → Settings data** (AGENTS.md rule: "Destructive Settings-wide actions belong in General → Settings data with an app-owned confirmation dialog"). Wipes views/instances/custom widgets and reseeds the Default view with one App Launcher.

## Theming integration

Dashboard chrome reads existing app CSS variables only: `var(--app-bg)`, `var(--surface)`, `var(--text)`, `var(--border)`, etc. No hardcoded colors. The topbar's bottom-fade gradient uses a `--scheme-tint-soft` style variable derived from the active scheme's existing accent tokens; no new color definitions are added.

Per-widget accent (`--w-accent`, `--w-accent-soft`) is set inline on each widget root and is independent of the active scheme. A purple widget stays purple regardless of theme.

## i18n

- All new user-visible strings route through `t()` with keys under the `dashboard.*` namespace (some already exist; this redesign adds ~40 keys for preset names, accent labels, icon picker tooltips, edit-mode controls, error reasons, empty-state copy).
- English (`src/i18n/locales/en.json`) lands in this PR.
- Every new key gets a `docs/LOCALIZATION.md` entry with the schema AGENTS.md requires.
- Other locale files are untouched.
- Built-in widget source titles use `titleKey`. AI-authored custom widget titles are not translated — they're stored as-is in the language the AI used.

## Quality gates

Before handing the PR back (per AGENTS.md):

- `npm run check`
- `npm run build`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- Manual `npm run tauri dev` smoke:
  - Default view appears with App Launcher pre-placed.
  - Drag and resize a widget; layout persists across app restart.
  - Customize a widget (preset / accent / icon / title); changes persist.
  - Add a built-in via the catalog; remove via X with confirm prompt.
  - Switch color schemes; dashboard chrome follows; widget accents stay independent.
  - AI Assistant can read the active view context.
  - Reset Dashboard via General → Settings data restores the seeded state.

## Follow-up backlog (captured, not built)

1. Redesign legacy widget bodies (hash, subnet, quick tools, report) with proper preset-aware UIs.
2. Native data widgets from the mockup: Clock, Weather, CPU, Memory, Recent Hosts, Session Activity, Today's Brief.
3. User-facing "Create custom widget" dialog.
4. Cross-view widget move (drag from one view's canvas to another view's pill).
5. Monaco-based script editor (replace the read-only source modal).
6. Per-widget keyboard shortcuts.
7. AI-Assistant UX polish around widget authorship: suggestion affordances, preview-before-commit, conversational diffs.
8. Persisted-settings export ZIP integration for dashboard tables.
9. Optional preset thumbnails inside the customize popover's preset row.
