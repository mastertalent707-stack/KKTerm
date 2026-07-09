# itops.hosts.deleteConfirmBody

- **English value**: `Its child Hosts are kept and move up one level. No Connection is deleted.`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/HostsPanel.tsx`
- **UI role**: `fragment`
- **User flow**: Body of the delete-Host confirmation explaining child promotion.
- **Tone**: concise/neutral
- **Placeholders**: none
- **Context/meaning**: Straightforward; no ambiguous senses.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
