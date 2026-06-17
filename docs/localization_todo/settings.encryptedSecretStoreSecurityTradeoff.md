# settings.encryptedSecretStoreSecurityTradeoff

- **English value**: `Compared with the OS keystore, encrypted database storage is more portable but puts recovery and file protection on you. Keep the database private and do not expose the master password through scripts, logs, or shell history.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/EncryptedSecretStoreDialog.tsx`
- **UI role**: `fragment`
- **User flow**: `Security warning shown in the encrypted database setup/unlock dialog on Windows and macOS.`
- **Tone**: `clear security warning`
- **Placeholders**: `none`
- **Context/meaning**: `This contrasts the encrypted SQLite secret store with the OS keystore before the user switches backends.`
- **Domain notes**: `Keep as two complete sentences; do not imply KKTerm can recover the master password.`

<!--
Filename: settings.encryptedSecretStoreSecurityTradeoff.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
