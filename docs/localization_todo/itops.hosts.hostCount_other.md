# itops.hosts.hostCount_other

- **English value**: `{{count}} Hosts`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/HostsPanel.tsx`
- **UI role**: `status`
- **User flow**: Host count in the Hosts segment toolbar (plural).
- **Tone**: concise/neutral
- **Placeholders**: {{count}}
- **Context/meaning**: i18next plural _other form.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
