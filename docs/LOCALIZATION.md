# Localization Backlog

This file tracks English source strings that still need translation. Product implementation is English first: add or update `src/i18n/locales/en.json` during feature work, then document any untranslated keys here with enough context for later localization.

When a key is translated into every supported locale, remove its entry from this file.

## Pending Strings

| Key | English | Namespace | File / Component | UI role | Flow / context | Tone | Placeholders | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `connections.import.setUsernameButton` | `Set username` | connections | `src/connections/ImportDialog.tsx` Bulk credential toolbar | Button | Connection import preview: opens a popover to enter a username and apply it to selected rows. | Concise, imperative | None | Replaces a denser inline form. Pairs with `setPasswordButton`. |
| `connections.import.setPasswordButton` | `Set password` | connections | `src/connections/ImportDialog.tsx` Bulk credential toolbar | Button | Mirrors the username flow, applies a password to selected rows. | Concise, imperative | None | Pairs with `setUsernameButton`. |
| `connections.import.bulkScopeAll` | `Apply to all selected` | connections | `src/connections/ImportDialog.tsx` Bulk credential popover | Radio label | Choice within Set username / Set password popover that overwrites every selected row. | Plain | None | Mutually exclusive with `bulkScopeUnfilled`. |
| `connections.import.bulkScopeUnfilled` | `Only fill unfilled entries` | connections | `src/connections/ImportDialog.tsx` Bulk credential popover | Radio label | Sibling of `bulkScopeAll`; only writes to selected rows whose value is empty. | Plain | None | "Entry" here means a selected import row. |
| `connections.import.bulkApply` | `Apply` | connections | `src/connections/ImportDialog.tsx` Bulk credential popover | Button | Confirms the bulk username/password assignment. | Concise, imperative | None | Differs from generic Save/OK; specific to the popover. |
| `connections.import.bulkCancel` | `Cancel` | connections | `src/connections/ImportDialog.tsx` Bulk credential popover | Button | Dismisses the popover without applying. | Concise, imperative | None | Maps to standard cancel verb. |
| `connections.import.bulkPasswordRequired` | `Enter a password to apply.` | connections | `src/connections/ImportDialog.tsx` Bulk credential popover | Inline error | Shown when the user clicks Apply without entering a password. | Plain, instructive | None | Mirrors `bulkUserRequired`. |
