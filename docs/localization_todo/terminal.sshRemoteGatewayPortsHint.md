# terminal.sshRemoteGatewayPortsHint

- **English value**: `Remote wildcard listeners require GatewayPorts clientspecified; GatewayPorts no restricts them to loopback.`
- **Namespace**: `terminal`
- **File/component**: `src/modules/workspace/connections/terminal/SshPortForwardingDialog.tsx`
- **UI role**: `status`
- **User flow**: Shown at the bottom left of the SSH Port Forwarding dialog while Remote mode is selected. It reminds users why a requested wildcard server listener may bind only to loopback.
- **Tone**: concise technical guidance
- **Placeholders**: none
- **Context/meaning**: `GatewayPorts` is the OpenSSH server setting; `clientspecified` and `no` are its literal configuration values and should remain unchanged.
- **Domain notes**: Preserve the SSH terminology and the distinction between a wildcard listener and the server's loopback interface.

<!--
Filename: terminal.sshRemoteGatewayPortsHint.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
