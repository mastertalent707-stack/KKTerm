# itops.hosts.importedNotice_other

- **English value**: `Imported {{count}} Hosts ({{skipped}} skipped).`
- **Namespace**: `itops`
- **File/component**: `src/modules/itops/HostImportDialog.tsx`
- **UI role**: `status`
- **User flow**: Status Bar notice after an import completes (plural).
- **Tone**: concise/neutral
- **Placeholders**: {{count}}, {{skipped}}
- **Context/meaning**: i18next plural _other form.
- **Domain notes**: "Host" is the IT Ops inventory entity (a device or VM/container guest); never translate it as the Connection's host field. SSH/WinRM/HTTPS stay English. Best-effort translations were added in the same change and still need a verified localization pass.
