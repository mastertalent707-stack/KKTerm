# settings.credentialStorageEncryptedComparison

- **English value**: `Encrypted database stores KKTerm secrets in SQLite protected by your master password. It works across platforms and can be unlocked with an environment variable, but anyone with the database and master password can decrypt it, and KKTerm cannot recover a lost password.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/CredentialsSettings.tsx`
- **UI role**: `fragment`
- **User flow**: `Security explanation shown in Credentials Settings when a Windows or macOS user selects encrypted database storage.`
- **Tone**: `clear security warning`
- **Placeholders**: `none`
- **Context/meaning**: `Encrypted database means KKTerm's SQLite-backed secret store protected by a master password.`
- **Domain notes**: `Keep as two complete sentences; do not imply the master password is recoverable.`

<!--
Filename: settings.credentialStorageEncryptedComparison.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
