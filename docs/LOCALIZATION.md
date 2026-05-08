# Localization Backlog

This file tracks English source strings that still need translation. Product implementation is English first: add or update `src/i18n/locales/en.json` during feature work, then document any untranslated keys here with enough context for later localization.

When a key is translated into every supported locale, remove its entry from this file.

## Pending Strings

All keys are structurally present in every locale file (flushed via `scripts/flush-locales.mjs`). Non-English locales currently carry the English fallback value for the entries below. They need real translation.

| Key | Namespace | English |
|-----|-----------|---------|
| wiki.backlinkCount | wiki | {{count}} backlinks |
| wiki.bodyPlaceholder | wiki | Write in Markdown. Use [[Page Name]] to link pages, [[[Connection Name]]] to link Connections, and #tags to organize notes. |
| wiki.noAttachments | wiki | No attachments yet. |
| wiki.collapseExplorer | wiki | Collapse file explorer |
| wiki.expandExplorer | wiki | Expand file explorer |
| wiki.collapseInspector | wiki | Collapse note inspector |
| wiki.expandInspector | wiki | Expand note inspector |
| wiki.splitMode | wiki | Split |
| wiki.viewModeLabel | wiki | Editor view mode |
| wiki.inspector | wiki | Inspector |
| wiki.graph | wiki | Graph |
| wiki.graphEmpty | wiki | Links you create will appear here. |
| wiki.wordCount | wiki | {{count}} words |
| wiki.characterCount | wiki | {{count}} characters |
