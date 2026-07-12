# settings.shortcutConflict

- **English value**: `This shortcut is already used by {{action}}.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/ShortcutsSettings.tsx`
- **UI role**: `error`
- **User flow**: `Error shown when the user records a key combination already bound to another action; {{action}} is the conflicting action's name.`
- **Tone**: `concise/neutral`
- **Placeholders**: `{{action}} = the localized name of the conflicting shortcut action`
- **Context/meaning**: `Workspace Module keyboard shortcut customization UI (Settings -> Shortcuts). "Tab" here means the frontend Workspace Tab container.`
- **Domain notes**: `"Workspace" is the top-level Module. "Tab" is the Workspace Tab container, not a browser tab. Keep key names like Ctrl/Shift/Cmd conventions intact.`

<!--
Filename: settings.shortcutConflict.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
