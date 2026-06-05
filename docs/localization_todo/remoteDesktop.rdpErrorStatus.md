# remoteDesktop.rdpErrorStatus

- **English value**: `RDP error: {{message}}`
- **Namespace**: `remoteDesktop`
- **File/component**: `src/modules/workspace/connections/remote-desktop/RemoteDesktopWorkspace.tsx`
- **UI role**: `error`
- **User flow**: The user sees this Status Bar notice when an RDP Session command or connection step fails. The same error text is also shown in the remote desktop Pane placeholder when applicable.
- **Tone**: `concise/neutral`
- **Placeholders**: `{{message}}` — backend or frontend error detail; the token must survive unchanged in every locale.
- **Context/meaning**: `RDP error` means a failure in the Windows Remote Desktop / Microsoft RDP ActiveX Session path, not a generic remote desktop or VNC error.
- **Domain notes**: `RDP` stays technical. `Session` is live runtime state; this string reports runtime failure and does not describe a durable Connection.

<!--
Filename: remoteDesktop.rdpErrorStatus.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
