# itops.hosts.deleteConfirmTitle

- **English value**: `Delete Host "{{name}}"?`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/HostsPanel.tsx`
- **UI role**: `heading`
- **User flow**: Title of the delete-Host confirmation sheet.
- **Tone**: concise/neutral
- **Placeholders**: {{name}}
- **Context/meaning**: Straightforward; no ambiguous senses.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
