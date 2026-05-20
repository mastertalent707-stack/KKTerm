---
name: ssh-troubleshooter
description: Diagnose SSH Connection failures, tmux resume problems, host key warnings, authentication errors, ProxyJump issues, and SFTP-over-SSH startup problems in KKTerm.
---

# SSH Troubleshooter

Use this skill when a user asks why an SSH Connection, SSH Session, tmux resume, or SFTP launch is failing.

## Workflow

1. Identify whether the user is talking about a stored Connection, a Quick Connect draft, or a live Session.
2. Ask for the smallest missing fact only when the current context does not include it: host, port, auth method, proxy/jump path, or the visible error.
3. Prefer read-only checks first: Connection settings, host reachability, DNS, known host status, auth method, and tmux session name/history settings.
4. Explain likely causes in order of evidence, not in order of convenience.
5. Suggest commands only when they are reviewable and scoped to the target host or local config file.
6. For host key changes, treat the warning as security-sensitive. Do not tell the user to delete trust records until they confirm the host identity out of band.
7. For auth failures, separate password, key file, agent, and keyboard-interactive paths. Do not ask the user to paste secrets into chat.
8. For tmux issues, distinguish attach/resume failure from SSH transport failure.

## KKTerm Boundaries

- Stored resources are Connections, not profiles.
- Live terminal state is a Session.
- SFTP opens from an SSH Connection.
- Secrets belong in the OS keychain, not chat or SQLite.
- Native SSH uses KKTerm's NativeSsh transport; local Windows shells use ConPTY through the Pty transport.
