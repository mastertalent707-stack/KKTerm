# Localization Backlog

This file tracks English source strings that still need translation. Product implementation is English first: add or update `src/i18n/locales/en.json` during feature work, then document any untranslated keys here with enough context for later localization.

When a key is translated into every supported locale, remove its entry from this file.

## Pending Strings

### ai.dashboardToolsDisabledTitle

- English value: `Dashboard tools are off`
- Namespace: `ai`
- File/component: `src/ai/AssistantPanel.tsx`
- UI role: status title
- User flow: Dashboard page is active while the AI Assistant Dashboard tool toggle is disabled.
- Tone: concise, neutral, explanatory.
- Placeholders: none.
- Domain notes: "Dashboard" is the built-in widget playground module. "Tools" refers to AI Assistant callable tools in Settings.

### ai.dashboardToolsDisabledHint

- English value: `Turn on Settings > AI Assistant > Assistant tools > Dashboard before the Assistant can create or change widgets.`
- Namespace: `ai`
- File/component: `src/ai/AssistantPanel.tsx`
- UI role: status hint
- User flow: Dashboard page is active and the user may expect natural-language widget creation to work.
- Tone: direct setup guidance.
- Placeholders: none.
- Domain notes: Keep Settings section names aligned with the localized Settings UI.

### ai.toolDashboard

- English value: `Updating Dashboard...`
- Namespace: `ai`
- File/component: `src/ai/AssistantPanel.tsx`
- UI role: tool-call status
- User flow: Assistant is running a Dashboard tool such as create custom widget or add widget instance.
- Tone: short progress phrase.
- Placeholders: none.
- Domain notes: Dashboard means the Dashboard module, not the default launch state.

### ai.toolDashboardDone

- English value: `Updated Dashboard`
- Namespace: `ai`
- File/component: `src/ai/AssistantPanel.tsx`
- UI role: completed tool-call status
- User flow: Assistant completed a Dashboard tool call.
- Tone: short completion phrase.
- Placeholders: none.
- Domain notes: Dashboard means the Dashboard module, not the default launch state.

(End of file)
