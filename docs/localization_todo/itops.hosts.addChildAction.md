# itops.hosts.addChildAction

- **English value**: `Add child Host`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/HostsPanel.tsx`
- **UI role**: `tooltip`
- **User flow**: Per-row icon action adding a child Host (VM/container) under this Host.
- **Tone**: concise/neutral
- **Placeholders**: none
- **Context/meaning**: Child Host = guest carried by a parent device Host.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
