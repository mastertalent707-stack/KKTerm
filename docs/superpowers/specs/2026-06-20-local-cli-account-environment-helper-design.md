# Local CLI Account Environment Helper

## Goal

Let a user create multiple Local terminal Connections for different Claude Code
or Codex accounts on one machine. Each Connection prepares a stable, isolated
CLI data directory; the user then signs in normally inside that terminal.
KKTerm never asks for, stores, copies, or injects the CLI's credentials.

## Scope

- Add an account-environment helper beside the Local Connection Startup script.
- Support exactly one selected tool account per generated helper block:
  Claude Code or Codex.
- Support native Command Prompt, PowerShell/PowerShell 7, and POSIX-compatible
  local shells, including WSL, Bash, and zsh.
- Support Claude Code CLI isolation on Windows, Linux, WSL, and macOS.
- Support Codex CLI isolation on Windows, Linux, WSL, and macOS.
- Keep Startup script as the only persisted Connection field used by this
  feature. Do not add a database column or a secret-store record.
- Omit OpenCode because its documented config-directory override does not also
  document relocation of `~/.local/share/opencode/auth.json`.
- Do not install either CLI, run a login flow, or launch a CLI automatically.

## Feasibility Basis

Claude Code uses `CLAUDE_CONFIG_DIR` as its alternate user configuration root.
On current macOS CLI releases, OAuth credentials are stored in Keychain entries
namespaced by a hash of that directory path. This behavior was observed in
Claude Code 2.1.56 and remains applicable to the current CLI line, although
Anthropic's authentication documentation still describes config-directory
credential relocation explicitly only for Linux and Windows. The generated
directory must therefore remain stable after the user logs in.

Codex stores local state under `CODEX_HOME`. Its current credential storage also
uses that home as the isolation key: file-backed credentials live under the
selected home, while keyring credentials use a key derived from a hash of the
home path. Separate stable homes can therefore retain separate interactive
logins without forcing plaintext credential storage.

Primary references:

- <https://code.claude.com/docs/en/authentication>
- <https://github.com/anthropics/claude-code/issues/20553>
- <https://github.com/anthropics/claude-code/releases/tag/v2.1.183>
- <https://developers.openai.com/codex/config-advanced>
- <https://developers.openai.com/codex/auth>
- <https://github.com/openai/codex/blob/main/codex-rs/login/src/auth/storage.rs>
- <https://opencode.ai/docs/config/>
- <https://opencode.ai/docs/providers/>

## User Experience

The Local Connection form keeps the existing Startup script textarea. Its label
row gains a compact secondary action named through i18n, such as
`connections.cliAccountHelper`.

Activating the action opens a small anchored form popover because the surface
contains interactive controls and is not a simple command menu. The popover
contains:

1. A Tool dropdown with Claude Code and Codex.
2. An Account label field, initially seeded from the Connection name when one
   exists.
3. A read-only directory preview.
4. Cancel and Apply actions using shared platform-aware action ordering.

The account label is converted to a conservative lowercase directory slug using
ASCII letters, numbers, hyphens, and underscores. Invalid or empty labels show
translated field validation inside the popover. Applying the helper updates the
visible Startup script; it does not save the Connection or run commands.

The helper identifies the selected Local shell family before opening. It
generates syntax for Command Prompt, PowerShell, or POSIX shells. If a custom
shell cannot be classified safely, the action stays unavailable with translated
supporting text rather than guessing syntax.

## Generated Script

Account directories use a stable per-user data root and a tool/account suffix:

- Native Windows: `%LOCALAPPDATA%\KKTerm\cli-accounts\<tool>\<slug>`
- POSIX, macOS, and WSL:
  `${XDG_DATA_HOME:-$HOME/.local/share}/kkterm/cli-accounts/<tool>/<slug>`

The generated block:

- creates the directory idempotently;
- sets only `CLAUDE_CONFIG_DIR` or `CODEX_HOME` in the current shell;
- contains no credential value;
- uses shell-appropriate quoting; and
- is wrapped in recognizable KKTerm begin/end comments.

Applying the helper again replaces the existing KKTerm-generated account block
instead of appending a duplicate. Text outside that marked block is preserved
byte-for-byte apart from the minimal newline needed to separate blocks. KKTerm
does not rewrite an unmarked environment command authored by the user.

The generated path remains fixed even if the Connection is renamed later. This
prevents macOS Claude Code from selecting a different Keychain namespace and
prevents either CLI from appearing logged out after an unrelated rename.

## Architecture

Add a focused pure TypeScript helper in the existing
`src/modules/workspace/connections/connection-dialog/` source area. It owns:

- shell-family classification from the selected local shell command;
- account-label slugging and validation;
- platform/shell-specific directory and command generation; and
- replacement of an existing marked helper block.

`LocalConnectionFields.tsx` owns only the popover state and applies the pure
helper's output to a controlled Startup script textarea. The existing
`ConnectionSidebar.tsx` form submission and `localStartupScript` persistence
remain unchanged. Session startup continues to send the saved script to the
opened shell through the existing `localStartupInputFor` path.

No Rust command, SQLite migration, credential backend change, MCP schema change,
or tutorial mapping is required.

## Errors and Safety

- Field validation remains inside the helper popover because it blocks form
  completion; transient outcomes are not rendered inline.
- The helper never reads CLI credential files or Keychain entries.
- The helper never puts API keys, OAuth tokens, or passwords in Startup script.
- Existing user Startup script content is preserved outside a marked generated
  block.
- Shell syntax is generated only for recognized shell families.
- Documentation states that the first CLI run in each isolated directory needs
  its own login and that Claude Code isolates settings, sessions, memory, and MCP
  configuration along with credentials.
- Documentation states that sufficiently old Claude Code versions may not have
  namespaced macOS Keychain behavior; users should update the CLI if profiles
  collide or repeatedly lose login state.

## Localization and Manual

All new visible labels, hints, validation messages, and accessible names use new
`connections.*` keys. English keys are added first. Each key receives the
required `docs/localization_todo/` pending file unless all 13 non-English locales
are translated in the same change; locale structure is verified with
`npm run i18n:check`.

Update `docs/manual/03-connections.md` to describe the helper, generated
environment variables, supported tools and shell families, first-login behavior,
stable-directory requirement, macOS Claude Code version caveat, and the fact
that no secrets are stored by KKTerm. The manual references i18n keys instead of
English labels.

## Verification

Focused automated tests will verify:

1. Claude Code and Codex generate the correct variable for Command Prompt,
   PowerShell, and POSIX shells.
2. Native Windows and POSIX/WSL/macOS paths use the intended stable roots.
3. Account labels are sanitized deterministically and invalid labels are
   rejected.
4. Applying a generated block preserves unrelated Startup script text.
5. Reapplying replaces the prior generated block without duplication.
6. Unknown custom shells do not receive guessed syntax.
7. The Local Connection form exposes the translated helper control and still
   submits through `localStartupScript`.

Run the focused frontend tests, TypeScript checking, and `npm run i18n:check`.
Because this is a small frontend behavior change, the full Rust suite is not
required unless implementation unexpectedly crosses the Tauri boundary. Final
interactive validation should use the real Tauri runtime for at least one
recognized local shell because standalone Vite cannot validate terminal startup
input.
