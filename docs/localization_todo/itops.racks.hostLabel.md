# itops.racks.hostLabel

- **English value**: `Host`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/RackItemDialog.tsx`
- **UI role**: `label`
- **User flow**: Rack Device editor field label for the bound IT Ops Host select.
- **Tone**: concise/neutral
- **Placeholders**: none
- **Context/meaning**: Host = IT Ops Host entity, not the Connection's host address.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
