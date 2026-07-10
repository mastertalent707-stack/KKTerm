# itops.hosts.empty

- **English value**: `No Hosts yet. Import a hostname list to build this Site's inventory.`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/HostsPanel.tsx`
- **UI role**: `status`
- **User flow**: Empty state of the Hosts segment when a Site has no Hosts yet.
- **Tone**: concise/neutral
- **Placeholders**: none
- **Context/meaning**: Host = durable IT Ops inventory entry addressed by hostname.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
