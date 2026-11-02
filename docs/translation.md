# Translations (Simplified Chinese, Japanese)

Step 7, Part 2. Plan reviewed by Codex (thread `01a19200-e08d-7f61-a533-e99bcd483ab0`) and approved by the owner on 2026-10-31. The English lessons were frozen on 2026-11-02 (commit `15f5c2c`).

## Policy

- **Machine-assisted, no human review** (the owner's choice): Claude translates, Codex cross-checks every batch sentence by sentence against the English, the glossary, and the shared facts. The app shows a "machine-assisted translation" label on every translated page, and English stays the reference.
- **Terms:** every translation uses `src/i18n/glossary.ts` (one term per concept; tests reject listed wrong terms).
- **Facts are shared with English:** answer indices, cards, and coach facts come from the English data. Tests check message values and tags, quiz choice counts, cards per question field and choice, and that number-only choices are identical; Codex's review checks that the meaning is the same.
- **A language ships only when Learn, Play, and Review are all translated.** Until then, translated pages are reachable only by direct link (`#/zh-Hans/…`, `#/ja/…`), and the language switch appears only on those pages.
- **Review records** (`src/i18n/reviews.ts`) fingerprint the English and the translation that were checked, with the glossary version. A "passed" record that no longer matches fails `src/i18n/reviews.test.ts`, so any later change to either side must be re-checked. Records stay "pending" until Codex's cross-check and the verification of its fixes pass.

## How it's built

- URLs: `#/zh-Hans/learn/1`, `#/ja/learn/1`; no language (or `en`) is English, so old links work. (Saved preference and browser-language detection come at release.)
- Interface text: React Intl with ICU messages in `src/i18n/messages/{en,zh-Hans,ja}.ts`, loaded only for the language in use.
- Lesson prose: one component per language and lesson (`src/learn/content/zh-Hans/lesson1.tsx`), around the shared diagrams.
- Quiz wording: `src/learn/quizzes-i18n.ts` (words only).
- Coach: lines carry facts (`CoachFact` in `src/game/coach.ts`); `src/i18n/coach-text.tsx` words them per language. A test proves the English built from facts equals the coach's English in every tested seat situation.
- Card names for screen readers: `cardName(code, locale)` ("红桃A", "ハートのエース").
- Fonts: system Chinese and Japanese fonts (no download), set by the page's `lang`.
- Untranslated parts (other lessons, Play, Review) show a note in the reader's language, then English in a true English scope (`lang="en"`, English card names and interface words); the coach's translated line keeps the reader's language inside it. Links keep the reader's language.
- Loading: a language's text loads once; while it loads the page says so in all three languages, and if it fails there's "Try again" and "Continue in English".
- Quiz wording is split per language (`src/learn/quiz-text/`) and loads only for that language.

## Pilot (2026-11-02)

Translated in both languages: the app frame, the lesson list (all unit and lesson titles and summaries), the lesson page and quiz frames, Lesson 1 with its timeline and 3 quiz questions, card names, and the coach's six-player position line.

## Review records

| Batch | English source | Translated | Codex cross-check | Result |
|---|---|---|---|---|
| Pilot | lessons frozen at `15f5c2c`; messages in `en.ts` | 2026-11-02 | Codex cross-check ("request changes": coach all-in wording, fallback scopes, loading, quiz checks, records, word choices), then two verification rounds | **passed** at `912465d`; fingerprints in `src/i18n/reviews.ts` |
