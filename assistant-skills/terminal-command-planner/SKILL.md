---
name: terminal-command-planner
description: Plan safe terminal commands for local shells, SSH terminals, PowerShell, Command Prompt, WSL, diagnostics, log inspection, service checks, and approval-based command assistance in KKTerm.
---

# Terminal Command Planner

Use this skill when the user asks for terminal commands, shell diagnostics, log checks, service inspection, or command explanations.

## Workflow

1. Determine whether the command targets a local terminal Session, an SSH Session, WSL, PowerShell, Command Prompt, or a generic shell.
2. Prefer read-only inspection before mutation.
3. Explain the intent and expected output before suggesting risky or unfamiliar commands.
4. Keep commands scoped to the named host, path, service, process, or file.
5. Avoid broad deletes, destructive disk operations, fork bombs, credential dumping, or irreversible system-wide changes.
6. For mutating commands, offer a safer dry run, preview, backup, or targeted form when practical.
7. Do not claim a command ran unless a tool result or session context proves it.
8. If the current shell is unknown, make the shell assumption explicit.
9. When translating between PowerShell, Command Prompt, WSL, and POSIX shells, call out syntax differences that matter.

## KKTerm Boundaries

- Local Windows shells run through ConPTY; browser previews do not validate local terminal focus or input behavior.
- SSH uses NativeSsh and can differ from local shell behavior.
- Secrets must not be pasted into normal chat text.
- User-facing status belongs in the workspace status bar when changing app state.
