# itops.hosts.importHint

- **English value**: `Paste hostnames — one per line (commas also separate, # starts a comment). Imported Hosts are scanned for SSH, WinRM, and HTTPS access automatically.`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/HostImportDialog.tsx`
- **UI role**: `fragment`
- **User flow**: Help copy above the hostname paste textarea in the import dialog.
- **Tone**: concise/neutral
- **Placeholders**: none
- **Context/meaning**: SSH/WinRM/HTTPS stay English; # refers to a literal comment character.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
