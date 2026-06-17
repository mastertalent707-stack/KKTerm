# settings.credentialStorageEncryptedLinuxReminder

- **English value**: `Linux uses encrypted database storage in this build. Protect your KKTerm database, use a long unique master password, and avoid putting KKTERM_SECRET_STORE_PASSWORD in shell history, logs, or shared startup scripts.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/CredentialsSettings.tsx`
- **UI role**: `fragment`
- **User flow**: `Linux-specific reminder shown in Credentials Settings because encrypted database storage is the only available backend in this build.`
- **Tone**: `clear safety reminder`
- **Placeholders**: `none`
- **Context/meaning**: `This explains Linux credential-backend limitations and safe handling of the environment variable master password.`
- **Domain notes**: `Keep KKTERM_SECRET_STORE_PASSWORD unchanged.`

<!--
Filename: settings.credentialStorageEncryptedLinuxReminder.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
