# settings.encryptedSecretStoreResetBody

- **English value**: `Create a new master password and clear the encrypted credentials that were saved with the previous password.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/EncryptedSecretStoreDialog.tsx`
- **UI role**: `fragment`
- **User flow**: `Body text shown in the destructive reset flow after encrypted database unlock fails.`
- **Tone**: `direct warning`
- **Placeholders**: `none`
- **Context/meaning**: `Clear means delete all encrypted credential rows from the SQLite secret store because they cannot be decrypted with the new master password.`
- **Domain notes**: `Keep as one complete sentence; do not imply saved Connection metadata is removed.`

<!--
Filename: settings.encryptedSecretStoreResetBody.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
