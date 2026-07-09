# itops.racks.hostHint

- **English value**: `The IT Ops Host this device is; its child Hosts show in the rack callout.`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/RackItemDialog.tsx`
- **UI role**: `fragment`
- **User flow**: Hint under the Rack Device editor's Host select.
- **Tone**: concise/neutral
- **Placeholders**: none
- **Context/meaning**: Straightforward; no ambiguous senses.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
