# settings.savedWebsitePasswordsHint

- **English value**: `Passwords stay in the selected secret store; non-secret input data and page details stay in SQLite for Autofill.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/UrlSettings.tsx`
- **UI role**: `label`
- **User flow**: Explains the storage boundary below the saved website password/input data heading.
- **Tone**: concise/neutral
- **Placeholders**: none
- **Context/meaning**: Secret passwords use the configured secret backend, while captured non-secret form values and page metadata are durable SQLite data used by Autofill.
- **Domain notes**: Do not translate selected secret store as OS keychain because KKTerm also supports encrypted database storage.
