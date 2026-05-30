# settings.advancedDebuggingHint

- **English value**: `Writes full AI Assistant, MCP, Installer Helper, and heartbeat debug logs even in release builds. Logs may include prompts, tool arguments, installer command output, screenshots, and generated widget source.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/GeneralSettings.tsx`
- **UI role**: `fragment`
- **User flow**: `Shown in Settings → General → Debug under the Advanced Debugging toggle. It tells users that enabling the release-build debug path also writes Installer Helper and heartbeat diagnostic output.`
- **Tone**: `concise/neutral`
- **Placeholders**: `none`
- **Domain notes**: `Installer Helper is a built-in Module name. MCP is the Model Context Protocol integration. Heartbeat debug logs record frontend/native liveness timing. Preserve the log/diagnostic meaning and the warning that command output may be written locally.`

<!--
Filename: settings.advancedDebuggingHint.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
