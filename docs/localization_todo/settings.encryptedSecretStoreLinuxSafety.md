# settings.encryptedSecretStoreLinuxSafety

- **English value**: `On Linux, encrypted database storage is the available credential backend in this build. Keep the KKTerm database private, back it up carefully, and store the master password outside KKTerm.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/EncryptedSecretStoreDialog.tsx`
- **UI role**: `fragment`
- **User flow**: `Linux-specific safety warning shown in the encrypted database setup/unlock dialog.`
- **Tone**: `clear safety reminder`
- **Placeholders**: `none`
- **Context/meaning**: `This tells Linux users they do not have an OS-keystore choice in this build and must protect the local encrypted database and master password.`
- **Domain notes**: `Do not imply the Linux backend is weaker cryptographically; the point is operational responsibility.`

<!--
Filename: settings.encryptedSecretStoreLinuxSafety.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
