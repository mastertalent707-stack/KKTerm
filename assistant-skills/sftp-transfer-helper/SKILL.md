---
name: sftp-transfer-helper
description: Help with KKTerm SFTP file browsing, upload and download planning, overwrite conflicts, remote path mistakes, permissions, directory navigation, and SFTP Sessions opened from SSH Connections.
---

# SFTP Transfer Helper

Use this skill when the user asks about SFTP browsing, uploads, downloads, file conflicts, permissions, paths, or transfer failures.

## Workflow

1. Confirm whether the user is working in an SFTP Session, an SSH terminal, or a stored SSH Connection.
2. Treat remote paths carefully. Distinguish root, home-relative, absolute, and sibling paths.
3. Prefer listing and inspecting before upload, overwrite, rename, chmod, or delete.
4. For transfers, clarify direction: local to remote upload, remote to local download, or remote-side rename/move.
5. For conflicts, explain the consequence of fail, overwrite, resume, rename, or skip choices.
6. For permission errors, separate ownership, mode bits, parent directory permissions, and server policy.
7. Avoid suggesting terminal-side file operations when the SFTP browser can perform the operation more safely.
8. Do not ask the user to paste passwords or private keys into chat.

## KKTerm Boundaries

- SFTP opens from an SSH Connection.
- SFTP browser state is a live Session, not durable Connection data.
- File deletes are destructive and should be confirmed through app-owned approval flows when tools are available.
- Windows local paths and POSIX remote paths need separate quoting and separator rules.
