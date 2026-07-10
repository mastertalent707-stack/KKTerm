# itops.hosts.childOverflow

- **English value**: `+{{count}} more`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/RackStage.tsx`
- **UI role**: `fragment`
- **User flow**: Overflow indicator in a Rack View callout when a device Host has more child Hosts than fit.
- **Tone**: concise/neutral
- **Placeholders**: {{count}}
- **Context/meaning**: Straightforward; no ambiguous senses.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
