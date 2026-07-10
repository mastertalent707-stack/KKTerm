# itops.hosts.bindingsHint

- **English value**: `Bind one or more Connections to this Host — e.g. its SSH terminal and an HTTPS URL Connection to its management interface.`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/HostBindingsDialog.tsx`
- **UI role**: `fragment`
- **User flow**: Help copy in the bindings dialog explaining multi-Connection binding.
- **Tone**: concise/neutral
- **Placeholders**: none
- **Context/meaning**: Connection = durable KKTerm Connection; SSH/HTTPS/URL stay English.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
