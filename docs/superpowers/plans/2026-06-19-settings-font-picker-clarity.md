# Settings Font Picker Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify both Settings font pickers with shared guidance, icon-only folder actions, three labeled groups, and English-first system font names.

**Architecture:** Keep the existing native selects and Tauri command boundary. The React components will use native optgroups and one shared i18n hint, while the Rust scanner will rank decoded family-name records so English metadata wins before typographic-vs-legacy family preference.

**Tech Stack:** React 19, TypeScript, i18next, Tauri v2, Rust 2024, `ttf-parser`, Node test runner.

---

## File map

- Create `tests/settings-font-picker-clarity.test.mjs`: focused source-level regression coverage for both Settings components and English locale text.
- Modify `src/modules/settings/AppearanceSettings.tsx`: icon-only folder action, shared hint, and Recommended optgroup.
- Modify `src/modules/settings/TerminalSettings.tsx`: shared hint and Recommended optgroup; preserve its existing icon-only folder action.
- Modify `src/i18n/locales/en.json`: update the shared hint and add the Recommended group label.
- Create `docs/localization_todo/settings.customFontsHint.md`: translation review record for the changed hint.
- Create `docs/localization_todo/settings.recommendedFonts.md`: translation review record for the new group label.
- Modify `docs/manual/15-settings.md`: document the new hint, group name, and English-first refresh behavior.
- Modify `src-tauri/src/media.rs`: choose one preferred family name per face using English-first ranking and add unit coverage.

### Task 1: Lock down the font-picker presentation

**Files:**
- Create: `tests/settings-font-picker-clarity.test.mjs`

- [ ] **Step 1: Write the failing frontend regression test**

Create the test with exact checks for the approved English hint, the Recommended key, both Recommended optgroups, unconditional hint usage, and icon-only folder button bodies:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [appearanceSource, terminalSource, localeSource] = await Promise.all([
  readFile(new URL("../src/modules/settings/AppearanceSettings.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/modules/settings/TerminalSettings.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/i18n/locales/en.json", import.meta.url), "utf8"),
]);
const locale = JSON.parse(localeSource);

function openFontsFolderButtonBody(source) {
  const marker = 'aria-label={t("settings.openCustomFontsFolder")}';
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, "open-fonts-folder button should have an accessible label");
  const bodyStart = source.indexOf(">", markerIndex) + 1;
  const bodyEnd = source.indexOf("</button>", bodyStart);
  return source.slice(bodyStart, bodyEnd);
}

test("font pickers share concise refresh and custom-folder guidance", () => {
  assert.equal(
    locale.settings.customFontsHint,
    "Press the refresh button to get system fonts. To use custom fonts, put them in the fonts folder.",
  );
  for (const source of [appearanceSource, terminalSource]) {
    assert.match(source, /<small className="field-hint">\s*{t\("settings\.customFontsHint"\)}\s*<\/small>/);
    assert.doesNotMatch(source, /customFonts\.length > 0 \? t\("settings\.customFontsHint"\)/);
  }
});

test("font pickers separate Custom, Recommended, and System groups", () => {
  assert.equal(locale.settings.recommendedFonts, "Recommended");
  for (const source of [appearanceSource, terminalSource]) {
    assert.match(source, /<optgroup label={t\("settings\.customFonts"\)}>/);
    assert.match(source, /<optgroup label={t\("settings\.recommendedFonts"\)}>/);
    assert.match(source, /<optgroup label={t\("settings\.systemFonts"\)}>/);
  }
});

test("open-fonts-folder actions are icon-only and remain accessible", () => {
  for (const source of [appearanceSource, terminalSource]) {
    const body = openFontsFolderButtonBody(source);
    assert.match(body, /<FolderOpen size={15} \/>/);
    assert.doesNotMatch(body, /openCustomFontsFolder/);
  }
});
```

- [ ] **Step 2: Run the new test and verify red state**

Run: `node --test tests/settings-font-picker-clarity.test.mjs`

Expected: FAIL because `settings.recommendedFonts` is absent, the hint has the old value, Appearance renders button text, and Recommended entries are not wrapped in optgroups.

### Task 2: Implement grouped, accessible font controls

**Files:**
- Modify: `src/modules/settings/AppearanceSettings.tsx:358-419`
- Modify: `src/modules/settings/TerminalSettings.tsx:271-338`
- Modify: `src/i18n/locales/en.json:1362-1370`
- Create: `docs/localization_todo/settings.customFontsHint.md`
- Create: `docs/localization_todo/settings.recommendedFonts.md`
- Modify: `docs/manual/15-settings.md:78,168`
- Test: `tests/settings-font-picker-clarity.test.mjs`

- [ ] **Step 1: Add the English label and replace the shared hint**

Keep the keys adjacent to the existing font-group keys in `en.json`:

```json
"customFonts": "Custom fonts",
"recommendedFonts": "Recommended",
"openCustomFontsFolder": "Open fonts folder",
...
"customFontsHint": "Press the refresh button to get system fonts. To use custom fonts, put them in the fonts folder.",
"noCustomFonts": "No custom fonts found. Add .ttf, .otf, .woff, or .woff2 files to the app fonts folder.",
"systemFonts": "System fonts"
```

- [ ] **Step 2: Update the Appearance picker**

Wrap `APP_UI_FONT_OPTIONS` in the Recommended optgroup, remove the visible folder-button text, and always render the shared hint:

```tsx
<optgroup label={t("settings.recommendedFonts")}>
  {APP_UI_FONT_OPTIONS.map((option) => (
    <option key={option.value} value={option.value}>
      {t(option.labelKey)}
    </option>
  ))}
</optgroup>
```

```tsx
<button
  aria-label={t("settings.openCustomFontsFolder")}
  className="toolbar-button"
  onClick={() => void handleOpenCustomFontsFolder()}
  title={t("settings.openCustomFontsFolder")}
  type="button"
>
  <FolderOpen size={15} />
</button>
```

```tsx
<small className="field-hint">{t("settings.customFontsHint")}</small>
```

- [ ] **Step 3: Update the Terminal picker**

Wrap both the default terminal option and `TERMINAL_FONT_OPTIONS` in the Recommended optgroup, and replace its conditional hint with the same unconditional hint:

```tsx
<optgroup label={t("settings.recommendedFonts")}>
  <option value={defaultTerminalFontValue}>{t("settings.terminalFontDefault")}</option>
  {TERMINAL_FONT_OPTIONS.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</optgroup>
```

```tsx
<small className="field-hint">{t("settings.customFontsHint")}</small>
```

- [ ] **Step 4: Add localization backlog records**

Create `settings.customFontsHint.md` with the exact changed value, both Settings components, UI role `hint`, direct setup-guidance tone, no placeholders, and context explaining that Refresh loads installed OS fonts while files placed in the app fonts folder become custom fonts.

Create `settings.recommendedFonts.md` with English value `Recommended`, both Settings components, UI role `label`, concise/neutral tone, no placeholders, and context explaining that it labels KKTerm's built-in suggested font choices rather than all installed fonts.

- [ ] **Step 5: Update the shipped Settings manual**

In both Appearance and Terminal font paragraphs, replace “curated” with “Recommended,” mention that the folder action is icon-only, record `settings.customFontsHint` as the shared refresh/custom-folder guidance, and state that refresh prefers English metadata names to avoid localized aliases duplicating Recommended entries.

- [ ] **Step 6: Run frontend and localization checks**

Run: `node --test tests/settings-font-picker-clarity.test.mjs`

Expected: PASS (3 tests).

Run: `npm run i18n:check`

Expected: PASS; non-English locales may omit pending English keys according to the repository backlog workflow.

- [ ] **Step 7: Commit the presentation change**

```powershell
git add -- tests/settings-font-picker-clarity.test.mjs src/modules/settings/AppearanceSettings.tsx src/modules/settings/TerminalSettings.tsx src/i18n/locales/en.json docs/localization_todo/settings.customFontsHint.md docs/localization_todo/settings.recommendedFonts.md docs/manual/15-settings.md
git commit -m "feat(settings): clarify font picker groups"
```

### Task 3: Prefer English system-font metadata

**Files:**
- Modify: `src-tauri/src/media.rs:270-296`

- [ ] **Step 1: Add failing candidate-selection unit tests**

Add a private test module beside the scanner helpers. The first test captures the reported localized-duplicate regression; the second preserves typographic-family preference when language priority ties:

```rust
#[cfg(test)]
mod system_font_tests {
    use super::{preferred_family_name, FontFamilyNameCandidate};

    #[test]
    fn prefers_english_family_name_over_localized_alias() {
        let selected = preferred_family_name([
            FontFamilyNameCandidate::new("微軟正黑體", ttf_parser::name_id::FAMILY, false),
            FontFamilyNameCandidate::new("Microsoft JhengHei", ttf_parser::name_id::FAMILY, true),
        ]);

        assert_eq!(selected.as_deref(), Some("Microsoft JhengHei"));
    }

    #[test]
    fn prefers_typographic_family_when_language_priority_matches() {
        let selected = preferred_family_name([
            FontFamilyNameCandidate::new("Example Legacy", ttf_parser::name_id::FAMILY, true),
            FontFamilyNameCandidate::new(
                "Example Sans",
                ttf_parser::name_id::TYPOGRAPHIC_FAMILY,
                true,
            ),
        ]);

        assert_eq!(selected.as_deref(), Some("Example Sans"));
    }
}
```

- [ ] **Step 2: Run the Rust tests and verify red state**

Run: `cargo test --manifest-path src-tauri/Cargo.toml system_font_tests --lib`

Expected: compilation FAIL because `preferred_family_name` and `FontFamilyNameCandidate` do not exist.

- [ ] **Step 3: Implement minimal English-first ranking**

Add this private candidate type and selector immediately before `collect_family_names`:

```rust
struct FontFamilyNameCandidate {
    value: String,
    name_id: u16,
    is_english: bool,
}

impl FontFamilyNameCandidate {
    fn new(value: impl Into<String>, name_id: u16, is_english: bool) -> Self {
        Self {
            value: value.into(),
            name_id,
            is_english,
        }
    }
}

fn preferred_family_name(
    candidates: impl IntoIterator<Item = FontFamilyNameCandidate>,
) -> Option<String> {
    candidates
        .into_iter()
        .filter(|candidate| {
            matches!(
                candidate.name_id,
                ttf_parser::name_id::TYPOGRAPHIC_FAMILY | ttf_parser::name_id::FAMILY
            ) && !candidate.value.trim().is_empty()
        })
        .min_by_key(|candidate| {
            (
                !candidate.is_english,
                candidate.name_id != ttf_parser::name_id::TYPOGRAPHIC_FAMILY,
            )
        })
        .map(|candidate| candidate.value.trim().to_string())
}
```

Replace the first-record logic inside each parsed face with candidate collection. Windows language IDs use `0x09` as the primary English language ID, so regional English variants all rank as English:

```rust
let candidates = face.names().filter_map(|name| {
    let value = name.to_string()?;
    let is_english = name.platform_id == ttf_parser::PlatformId::Windows
        && name.language_id & 0x03ff == 0x09;
    Some(FontFamilyNameCandidate::new(value, name.name_id, is_english))
});
if let Some(name) = preferred_family_name(candidates) {
    out.insert(name);
}
```

- [ ] **Step 4: Run the focused Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml system_font_tests --lib`

Expected: PASS (2 tests).

- [ ] **Step 5: Format only the touched Rust file**

Run: `rustfmt --edition 2024 src-tauri/src/media.rs`

Expected: command succeeds and does not touch unrelated Rust files.

- [ ] **Step 6: Re-run the focused Rust tests after formatting**

Run: `cargo test --manifest-path src-tauri/Cargo.toml system_font_tests --lib`

Expected: PASS (2 tests).

- [ ] **Step 7: Commit the scanner change**

```powershell
git add -- src-tauri/src/media.rs
git commit -m "fix(fonts): prefer English system family names"
```

### Task 4: Final focused verification

**Files:**
- Verify all files changed in Tasks 1-3.

- [ ] **Step 1: Run the focused frontend regression test**

Run: `node --test tests/settings-font-picker-clarity.test.mjs`

Expected: PASS (3 tests).

- [ ] **Step 2: Run locale validation**

Run: `npm run i18n:check`

Expected: PASS.

- [ ] **Step 3: Run TypeScript validation**

Run: `npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 4: Run focused Rust coverage**

Run: `cargo test --manifest-path src-tauri/Cargo.toml system_font_tests --lib`

Expected: PASS (2 tests).

- [ ] **Step 5: Inspect the final diff**

Run: `git diff HEAD~2 --check` and `git status --short`.

Expected: no whitespace errors; only the planned font-picker, scanner, test, manual, and localization files differ from the approved design commit.

