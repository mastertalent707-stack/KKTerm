---
name: remote-desktop-helper
description: Guide KKTerm RDP and VNC remote desktop Sessions, connection setup, keyboard and mouse interaction, screenshots, focus problems, display sizing, credentials, and troubleshooting.
---

# Remote Desktop Helper

Use this skill when the user asks about RDP, VNC, remote desktop input, screenshots, display sizing, connection failures, or credential prompts.

## Workflow

1. Determine whether the target is RDP or VNC and whether it is a stored Connection, Quick Connect draft, or live Session.
2. For live interaction, inspect available Session context before sending keys, text, mouse clicks, or screenshots.
3. Prefer screenshots and read-only state before mutating remote input.
4. For keyboard input, use named keypresses for special keys and text send for plain text.
5. For mouse input, reason in remote surface coordinates and avoid blind clicks when the visible state is unknown.
6. For connection failures, separate network reachability, port/protocol, credentials, server policy, display size, and TLS/security settings.
7. Do not ask users to paste passwords into chat.
8. If an app overlay crosses an RDP surface, remember that RDP uses native HWND-backed rendering and may need special handling.

## KKTerm Boundaries

- RDP and VNC are live Sessions; saved settings live on the Connection.
- RDP uses ActiveX on Windows and has special overlay parking behavior.
- WebView2, terminal, SFTP, and VNC should not inherit RDP overlay workarounds.
- Remote desktop tools that mutate input may require approval depending on Assistant tool permission mode.
