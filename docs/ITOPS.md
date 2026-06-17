# IT Ops Module Architecture

The IT Ops Module is a built-in Activity Rail destination for fleet
operations: running the same task across many hosts at once and watching
signals to react automatically. It absorbs and evolves the in-memory
Watchdog into durable, saveable Automations.

This document describes the durable architecture. The decision record and
its trade-offs live in `docs/ADR/0011-it-ops-module.md`. When this doc
conflicts with `docs/ARCHITECTURE.md`, this doc wins for IT-Ops-internal
concerns.

## Scope

The IT Ops Module owns:

- **Host Groups** — durable named selections of existing Connections used
  as fleet targets.
- **Batch Runs** — fan-out task execution across a Host Group with
  per-host live output and a consolidated, saved run report.
- **Automations** — durable trigger → condition → action rules (the
  evolved Watchdog), including the live run loop and Status Bar surface.
- The Tauri commands the AI Assistant uses to draft and manage Host
  Groups and Automations.
- The IT Ops page-context projection supplied to the shared AI Assistant
  panel.

It does not own:

- The durable **Connection** model or Connection Tree (it only references
  Connection ids; `src/modules/workspace/`).
- **Secret** storage (SMTP/webhook/WinRM credentials live in the OS
  keychain under existing secret owners).
- The **Install Helper** catalog (the PsExec recipe is a normal catalog
  entry; `src-tauri/installer/`).
- Selective export/import shape (extends the ADR-0010 flow; it does not
  fork it).

## Why this is one Module, not three features

Batch Runs and Automations are the same primitive seen from two
directions. A Batch Run is a task executed **now** against a Host Group.
An Automation is a saved rule that may **run a Batch Run later** when a
trigger fires. They share the host-targeting model (Host Groups), the
fan-out executor, the transport adapters, and the run-history store.
Keeping them in one Module lets an Automation's `runBatch` action reuse
the exact executor a manual run uses.

## Domain Concepts

**Host Group** — a durable, named selection of fleet targets, stored in
`itops_host_groups`. It carries an ordered set of Connection ids plus an
optional dynamic filter (by Connection type and/or folder) resolved at
run time. A Host Group is **not** a Connection and owns no Session and no
secret. Resolving a Host Group yields a concrete list of Connections at
the moment a run starts; dynamic filters mean later-added Connections are
picked up automatically.
_Avoid_: host list, inventory, connection group (as a Connection type)

**Transport** — how a Batch Run reaches one host. Per host (derived from
the Connection, overridable per Host Group/run):

| Transport | Reaches | Backend |
| --- | --- | --- |
| `ssh` | SSH/Linux hosts and Windows hosts running OpenSSH | existing `russh` exec channel — no new transport code |
| `winrm` | Windows hosts over WS-Man/HTTP(S) | pure-Rust WinRM client; standard path for Windows Update playbooks |
| `psexec` | Windows hosts over SMB/named pipes | Sysinternals `PsExec` shipped via an Install Helper recipe |

**Batch Task** — what a run executes on every targeted host. Two kinds:

- `script` — a free-form command/script body the user supplies, sent to
  each host's transport.
- `playbook` — a curated, parameterized update sequence (`apt`, `dnf`,
  `yum`, Windows Update) with a **dry-run preview** and **explicit
  per-run approval** before any mutating step. Playbooks are pure data,
  like Install Helper recipes — no arbitrary script strings baked in.

**Batch Run** — one execution of a Batch Task against a resolved Host
Group. Live run state (per-host status, streamed stdout/stderr, exit
codes, cancellation) is **in-memory**; on completion a consolidated
report is written to `itops_run_history`. Concurrency is bounded
(mirroring the Connection Batch Importer's network-scan fan-out in
`src-tauri/src/import.rs`); a single slow or black-holed host must not
stall the others or the UI thread.

**Automation** — a durable rule stored in `itops_automations`: one
**trigger**, an optional **condition**, and an ordered list of
**actions**. It is the durable generalization of today's
`WatchdogConfig`. Definitions persist and **re-arm on app launch**;
their live poll/run state stays in-memory in the Automation runtime.

**Trigger** — generalizes `WatchdogTarget`. Existing samplers
(performance counter, ping, TCP reachability, SSH output silence) carry
over unchanged; new samplers add scheduled probe (cron), output regex
match, SFTP path change, inbound webhook, and a structured/unstructured
datasource poller (HTTP-JSON, command output, log file).

**Condition** — the existing `PredicateOp` set
(`gt/lt/gte/lte/eq/ne/contains/silenceFor`), evaluated by the unchanged
pure `evaluate_predicate`. Optional: a trigger like cron or webhook may
fire unconditionally.

**Action** — generalizes `WatchdogAction` into a finite typed catalog
executed in order when the rule fires:

| Action | Effect |
| --- | --- |
| `notify` | Status Bar / toast / sound, the current `Notify` behavior |
| `popup` | App-owned desktop popup dialog |
| `email` | SMTP send (credentials from keychain) |
| `webhook` | Outbound HTTP request to a declared origin |
| `runBatch` | Start a Batch Run on a named Host Group + Task |
| `aiIntervene` | The existing approval-gated AI sub-turn |

The catalog is closed and typed on purpose: it is the "light n8n" payoff
without becoming an open agent. Actions do not pass arbitrary data
between each other (no DAG); each reads the trigger snapshot.

## Persistence

Three SQLite tables (new schema version):

- `itops_host_groups` — id, name, ordered Connection ids, optional
  dynamic filter, transport defaults.
- `itops_automations` — id, name, enabled flag, trigger config, optional
  condition, ordered actions, poll/stop/suppression settings (the durable
  superset of `WatchdogConfig`).
- `itops_run_history` — id, source (manual run or automation id), task
  summary, started/finished, per-host outcome summary, consolidated
  report blob. Local-first; no telemetry.

Durable definitions only. **Live state never persists**: in-flight Batch
Run progress, Automation poll ticks, tick ring buffers, and runtime state
machines stay in memory in the runtime layer, consistent with the
High-Risk Invariant against putting Session/runtime state in durable
models. On launch, the Automation runtime hydrates enabled rows from
`itops_automations` and arms them; disabled rows are loaded but not
polled.

Secrets (SMTP password, webhook bearer token, WinRM/PsExec credentials)
live in the OS keychain under existing secret-owner ids; SQLite stores
only non-secret metadata and credential references. IT Ops state is
included in the selective export/import shape (ADR-0010) as non-secret
metadata.

## Runtime

The existing Watchdog runtime (`src-tauri/src/watchdog/registry.rs`) is
the Automation runtime, extended rather than rewritten:

- The per-rule `tokio::time::interval` task, `CancellationToken`,
  sustained-window tracking, stop-condition arbitration, and single
  `watchdog://event` channel are preserved.
- `evaluate_predicate` and the predicate/state enums are reused as-is.
- The trigger sampler dispatcher (a free function today) gains the new
  trigger kinds; the action executor gains the new action kinds. Both
  extension points already exist for exactly this.
- A startup hook reads `itops_automations` and creates one runtime entry
  per enabled rule.

The Batch Run executor is a sibling worker pool: resolve the Host Group,
open one transport task per host under a concurrency cap, stream progress
events on a channel, and assemble the report. SSH reuses the existing
transport; WinRM and PsExec are new transport adapters behind a common
`exec(host, task) -> stream` shape.

All exec, WinRM/SMTP/webhook I/O, and probes run through
`spawn_blocking`/worker tasks and report by event — never blocking the
UI/native thread (`docs/ARCHITECTURE.md` command-runtime boundaries).

## Frontend

`src/modules/itops/` owns the Module shell with three tabs (Host Groups,
Batch Runs, Automations). The live Batch Run view renders a per-host grid
with status chips and expandable streamed output (reusing the read-only
terminal/Log viewer surfaces). The Automations list reuses the existing
`WatchdogDetail`/`WatchdogStatusBar` components for the live view; the
Status Bar indicator continues to surface running Automations app-wide.

All user-visible strings use a new `itops` i18n namespace following the
i18n rules in `AGENTS.md`. New dialogs/sheets follow
`docs/DESIGN_LANGUAGE.md` and the dialog primitives in `src/app/ui/dialog`.

## AI Assistant integration

IT Ops commands are registered as approval-gated assistant tools, the
same model Dashboard uses. The assistant may draft a Host Group or an
Automation (trigger + condition + actions) from a typed schema; a
successful mutating tool emits an `itops-changed` backend event that
reloads the IT Ops store so the new rule appears without restart. The
page-context payload is a compact projection — Host Group names/counts,
Automation names/states, recent run summaries — never full run output,
streamed host buffers, secrets, or credential references. Mutating
actions (starting a Batch Run, enabling an Automation) go through the
existing approval flow; the assistant cannot run a fleet task silently.

## Migration from Watchdog

The Watchdog is not deleted — it is the seed of the Automation runtime.
Migration steps, at a design level:

1. Add the three SQLite tables and the schema version bump.
2. Add a durable `Automation` definition that is a superset of
   `WatchdogConfig`; load enabled rows at startup into the existing
   registry.
3. Extend the trigger dispatcher and action executor with the new kinds.
4. Build the Host Group resolver and the Batch Run executor (SSH first;
   WinRM and PsExec adapters next).
5. Add the `src/modules/itops/` Module shell and `itops` namespace;
   re-home the existing `WatchdogDetail`/`WatchdogStatusBar` views under
   the Automations tab while keeping the Status Bar indicator.

`CONTEXT.md`'s Watchdog entry is updated to note Automations are now
durable IT Ops rules while live run state remains in-memory.
