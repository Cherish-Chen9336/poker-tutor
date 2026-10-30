# Poker Tutor

A single-player browser app for learning Texas Hold'em from zero: the learner plays against simple bots while the app teaches through hand-ranking references, live hints, win odds, and post-hand reviews.

## Working with the owner

- The owner does not write code. Claude writes the code; the owner makes decisions, writes plain-English test scenarios, and checks behavior.
- Explain choices in plain English and define poker and engineering terms the first time they come up.
- The owner is learning poker as the app is built. When a test or bug reveals a poker rule, explain the rule.
- Plan larger steps and get the owner's approval before coding. Commit after each step once the tests pass.
- Get an independent Codex review at each milestone (`/cc-suite:review-plan`, `/cc-suite:audit`).

## Scope

- In scope: single player against 1–5 bots, in the browser only, hosted as a static site (GitHub Pages).
- Out of scope for now: multiplayer, accounts, servers, real money. Keep the game logic free of UI code so it could run on a server later.

## Stack and decisions

Decided 2026-10-28 together with Codex (thread `01a1823c-03a5-7e90-9101-798007d1ecff`).

- TypeScript + React + Vite. Vitest for tests. Oxlint for linting.
- Node 24 (see `.nvmrc`), because `@pokertools/engine` requires it. Run `nvm use` before running npm commands. `npm ci` warns "EBADENGINE" because the library also asks for npm 12.2+, while Node 24 ships npm 11; this is harmless, but CI must not set `engine-strict`.
- **Engine:** `@pokertools/engine` 2.1.0, which handles dealing, betting, side pots, and refunds of uncalled bets.
- **Hand ranking:** `@pokertools/evaluator` 2.1.0. A lower score is a stronger hand.
- **Cross-check:** `pokersolver` (dev only) independently confirms the evaluator. Its types are in `src/types/pokersolver.d.ts`.
- Dependency versions are pinned exactly. Upgrade them deliberately and rerun all tests.
- Rejected options:
  - Forking PokerTH, because we would have to adapt and own a whole product that wasn't built for teaching.
  - `poker-ts`, because after a short all-in it sets the minimum raise incorrectly (`betting-round.ts:94`).

## Library rules

- App code (screens, bots, lessons) uses only the adapter in `src/game/` (`Table` and the types in `src/game/types.ts`), never `@pokertools` directly. Only `src/game/` and the engine tests import the library.
- The adapter builds its engine with `new PokerEngine` and a random source that uses queued shuffle numbers for a fixed deal and otherwise `getBrowserRNG()` (Web Crypto). Never rely on the engine's default shuffler: it uses Node's `crypto` module, which does not exist in browsers.
- The evaluator's `HandRank` is a `const enum` and `getHandRank` is not exported. Use `rankBoard` and `rankDescription` instead.
- `@pokertools` is young (7 GitHub stars), which is why it sits behind the adapter and could be replaced. The rules tests (`src/engine/scenarios.test.ts`) must pass before UI is built on top of it.
- **Local patch** (`patches/@pokertools+engine+2.1.0.patch`, reapplied by `postinstall`). Neither bug was reported upstream as of 2026-10-29. Recheck the patch whenever the library is upgraded. It fixes two bugs:
  - `calculateSidePots` (`side-pots.js`) merges pot levels that have identical eligible seats. Without it, when folded players had invested different amounts, a tied pot was split level by level and odd chips went to the wrong player (14/16 instead of 15/15). Regression test: `src/engine/rules.test.ts`.
  - `isActionComplete` (`action-order.js`) ends the betting when only one player with chips is left against all-in opponents and has matched every chip actually bet; `handleDeal` (`dealing.js`) runs that check right after the blinds are posted. Without it, that player was still asked to act: folding crashed the engine ("Side pot has no eligible players") or gave up a pot that should have gone to showdown. Found by Codex. Regression tests: scenarios 20 and 21.
- **Empty seats:** with 3+ players and an empty or busted seat, the engine can make the same player post the big blind twice in a row (it treats empty seats as dead blind positions). Going down to heads-up works correctly. Until this is solved, `Table.dealHand()` refuses 3+ player tables with a gap. **Open decision for Step 6:** top up busted bots between hands so seats never empty, or have the adapter place the blinds itself.
- `createBrowserEngine` ignores a supplied `randomProvider`, so the adapter doesn't use it. Fixed deals (`src/game/fixed-deal.ts`) work by reversing the engine's Fisher-Yates shuffle, which assumes the unshuffled deck is card codes 0–51 in order. The rigged-deck test in `src/engine/rules.test.ts` guards that assumption.
- The engine accepts some loose input that the adapter rejects on purpose: "bet" when there is already a bet (it turns it into a raise), amounts above a player's stack (it treats them as all-in), and bets or raises when no opponent has chips left to respond. The adapter's legal moves are cross-checked against the engine in `src/game/table.test.ts`.
- Chip totals must count stacks, pots, and `currentBets`. Bets in front of players are not in `pots` until the street ends.

## Teaching correctness

- Live hints may use only information the player can see.
- Odds must state their assumptions about opponents and account for ties.
- Reviews judge decisions, not results. A lucky win is not good play.

## Roadmap

Revised 2026-10-29 after a whole-plan review with Codex.

1. ✅ Setup and library smoke tests (`src/engine/smoke.test.ts`)
2. ✅ **Visual preview:** a clickable sketch of the table and one narrated example hand. Saved as the design reference in `docs/design/preview.html`: a dark "card room" look (Bodoni Moda, Instrument Sans, IBM Plex Mono), a coach that explains *why*, and hand odds for 7 cards (2 private + 5 shared), not 5.
3. ✅ **Engine validation and adapter:** rules tests from `docs/rules-scenarios.md` (Claude verifies the expected results against the TDA rules; the owner reviews whether the explanations make sense to a beginner), plus the app-owned adapter (legal actions and amounts, player views without hidden cards, settlement, fixed deals for tests and lessons)
4. **Learn:** 10 short lessons with quick checks and diagrams, plus GitHub Pages and CI. Plan reviewed by Codex (thread `01a18bab-3775-78a1-8a8e-d081ee9cb261`, "approve with changes") and approved by the owner on 2026-10-30.
   1. The goal and the flow of a hand: chips, the pot, preflop/flop/turn/river, winning at showdown or when everyone else folds
   2. Your cards and the board: 2 private + 5 shared, best 5 of 7 using 2, 1, or 0 private cards, "the nuts" (the best possible hand on this board)
   3. Hand rankings: a 10-row ladder (a royal flush is the top straight flush), ace-low straight, suits never break ties
   4. Seats: button, blinds, turn order, the heads-up flip, why acting last is an advantage
   5. Actions: fold/check/call/bet/raise, "raise to" vs. "raise by", minimum bet and raise. Checking needs nothing to call (the big blind can check after calls); the preview's definition was wrong.
   6. All-in: short calls, refunds of uncalled chips, the board running out with no more betting, a short all-in not reopening the betting. Side pots wait until Step 6 (heads-up has none).
   7. Showdown: kickers, split pots, showing and mucking. Needs an adapter action to show cards (the engine mucks losing hands by default; `rules/showdown.js`, SHOW action).
   8. Guided practice hand: a tested script (setup, `FixedDeal`, expected actor and street, each `Move`, checkpoints) run through `Table`. Back/Restart rebuilds the table and replays moves. The coach uses only the learner's view.
   9. Expected value and pot odds: graded questions use fully stated situations (heads-up, known opponent hand, calls that close the betting). `EV(call vs. fold) = equity × (P + C) − C`, where P includes bets in front of players and equity counts a tie as half. The rule of 2 and 4 is labeled an estimate; implied odds are only mentioned.
   10. Gambler's fallacy: independent reshuffled heads-up showdowns in 4-hand blocks; after 3 losses (ties break a streak), how often the 4th hand is QQ+/AK (34/1326 ≈ 2.56%). Show the sample size and margin of error, never rerun until it looks good, and say the *chance* is unchanged (counts wobble).
   - Lesson prose lives in `docs/lessons.md` (the owner reviews it before UI work). Quiz data (cards, choices, assumptions, answers, explanations) lives in typed fixtures shared by tests and UI. Winners are checked by the evaluator, legal moves by `Table`, and EV by exact enumeration. Conceptual answers need human review.
   - Simulation shuffling lives in `src/game/` (Fisher-Yates over the approved random source, seeded in tests). It never uses the engine's default shuffle.
   - App shell: hash URLs (e.g. `#/learn/6`), React state only, versioned progress in `localStorage` with an in-memory fallback, native quiz controls, announced feedback, spoken card names, SVG text equivalents, and reduced motion.
   - Order: lesson texts → the owner's review → app shell and lessons 1–7 → practice hand and lessons 9–10 → Codex review → commit.
   - Early lessons use fixed examples plus the evaluator; the guided hand uses the real engine through the adapter. Never build a second betting engine. Diagrams are drawn in code as SVG in the preview's style, with text labels.
5. **Heads-up play** against one simple bot with a coach panel, plus a basic post-hand review. Right after it, a second set of thinking lessons that link to hands the learner has played: why bluffing works (game theory: mixed strategies), sunk cost, resulting (judging a decision by its outcome), and bankroll management with the Kelly criterion (betting math, not game theory; explain why players risk only a fraction of Kelly). Decided by the owner on 2026-10-30.
6. **Six players, live hints, and win odds**

Throughout the plan:
- Deploy early to GitHub Pages, and add CI on Node 24 (`npm ci`, test, lint, build).
- Build mobile-friendly layouts, keyboard controls, and card labels that don't rely on color alone.
- Save lesson progress in the browser, with a reset option.

Notes for Steps 4–6 (from the Step 3 review with Codex):
- Give each bot its own `table.view(seat)`, never the engine state, so bots can't see hidden cards.
- The adapter keeps no hand history yet. Before building Review, record each accepted move with the viewer's `TableView` at that moment, so reviews judge decisions only on what the player knew then.

Bots use one documented, reproducible policy that sees only that bot's cards and public information. Out of scope for v1: strategy grading, multiple bot personalities, advanced odds modeling.

The app has three areas: **Learn** (lessons), **Play** (a table against bots with a coach), and **Review** (a replay of each hand with explanations).

## Commands

- `npm test` runs the tests.
- `npm run build` type-checks the code and builds the site.
- `npm run dev` starts a local preview.
