# settings.builtInMcpAllowAllDangerousHint

- **English value**: `When enabled, MCP tools with a dangerous namespace segment execute without confirmation prompts.`
- **Namespace**: `settings`
- **File/component**: `src/modules/settings/AiSettings.tsx`
- **UI role**: `fragment`
- **User flow**: The user sees this hint beside the built-in MCP dangerous-tools toggle in AI Assistant Settings on Windows.
- **Tone**: concise/neutral safety guidance
- **Placeholders**: none
- **Context/meaning**: “dangerous namespace segment” means the literal `dangerous` segment anywhere in a published dotted KKTerm MCP tool name; it is not a single `kkterm.dangerous.*` prefix.
- **Domain notes**: Keep MCP and the literal technical term `dangerous` unchanged where practical.
