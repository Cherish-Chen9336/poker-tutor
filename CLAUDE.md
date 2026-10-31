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

- App code (screens, bots, lessons) uses only the adapter in `src/game/` (`Table`, the hand helpers in `src/game/hands.ts`, and the types in `src/game/types.ts`), never `@pokertools` directly. Only `src/game/` and the engine tests import the library.
- The evaluator is large (about 80 KB compressed), so screens that need it load lazily (`LessonPage` in `App.tsx`). Keep it out of the first page load.
- Lesson quizzes live in `src/learn/quizzes.ts`; `quizzes.test.ts` verifies every non-"review" answer and checks the wording against `docs/lessons.md`. Change both together. Diagram facts live in `src/learn/diagram-data.ts` and are tested the same way.
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
4. ✅ **Learn:** 10 short lessons with quick checks and diagrams, plus GitHub Pages and CI. Done 2026-10-30; Codex audit (thread `01a18cbc-02b3-70b2-937a-7210b4bf7969`) found 9 issues, all fixed and verified. Plan reviewed by Codex (thread `01a18bab-3775-78a1-8a8e-d081ee9cb261`, "approve with changes") and approved by the owner on 2026-10-30.
   1. The goal and the flow of a hand: chips, the pot, preflop/flop/turn/river, winning at showdown or when everyone else folds
   2. Your cards and the board: 2 private + 5 shared, best 5 of 7 using 2, 1, or 0 private cards, "the nuts" (the best possible hand on this board)
   3. Hand rankings: a 10-row ladder (a royal flush is the top straight flush), ace-low straight, suits never break ties
   4. Seats: button, blinds, turn order, the heads-up flip, why acting last is an advantage
   5. Actions: fold/check/call/bet/raise, "raise to" vs. "raise by", minimum bet and raise. Checking needs nothing to call (the big blind can check after calls); the preview's definition was wrong.
   6. All-in: short calls, refunds of uncalled chips, the board running out with no more betting, a short all-in not reopening the betting. Side pots wait until Step 6 (heads-up has none).
   7. Showdown: kickers, split pots, showing and mucking. Needs an adapter action to show cards (the engine mucks losing hands by default; `rules/showdown.js`, SHOW action).
   8. Guided practice hands (4, decided 2026-10-30: a showdown win, folding early, the bot folding, a split pot; learner alternates button and big blind): each a tested script (setup, `FixedDeal`, expected actor and street, each `Move`, checkpoints) run through `Table`. Back/Restart rebuilds the table and replays moves. The coach uses only the learner's view.
   9. Expected value and pot odds: graded questions use fully stated situations (heads-up, known opponent hand, calls that close the betting). `EV(call vs. fold) = equity × (P + C) − C`, where P includes bets in front of players and equity counts a tie as half. The rule of 2 and 4 is labeled an estimate; implied odds are only mentioned.
   10. Gambler's fallacy: independent reshuffled heads-up showdowns in 4-hand blocks; after 3 losses (ties break a streak), how often the 4th hand is QQ+/AK (34/1326 ≈ 2.56%). Show the sample size and margin of error, never rerun until it looks good, and say the *chance* is unchanged (counts wobble).
   - Lesson prose lives in `docs/lessons.md` (the owner reviews it before UI work). Quiz data (cards, choices, assumptions, answers, explanations) lives in typed fixtures shared by tests and UI. Winners are checked by the evaluator, legal moves by `Table`, and EV by exact enumeration. Conceptual answers need human review.
   - Simulation shuffling lives in `src/game/` (Fisher-Yates over the approved random source, seeded in tests). It never uses the engine's default shuffle.
   - App shell: hash URLs (e.g. `#/learn/6`), React state only, versioned progress in `localStorage` with an in-memory fallback, native quiz controls, announced feedback, spoken card names, SVG text equivalents, and reduced motion.
   - Order: lesson texts → the owner's review → app shell and lessons 1–7 → practice hand and lessons 9–10 → Codex review → commit.
   - Early lessons use fixed examples plus the evaluator; the guided hand uses the real engine through the adapter. Never build a second betting engine. Diagrams are drawn in code as SVG in the preview's style, with text labels.
5. ✅ **Heads-up play** against one simple bot with a coach panel, plus a basic post-hand review. Done 2026-10-31; Codex audit (thread `01a18d58-4720-7d92-849d-d85c554fafe9`) found 15 issues, all fixed and verified over four rounds, with a fuzz test for damaged saved hands (`src/review/review-fuzz.test.tsx`). Plan approved by the owner on 2026-10-30:
   - 5a. **Bot and recording** (`src/game/`): one documented, cautious bot policy that decides only from its own `table.view(seat)` and legal moves (a test proves hidden cards can't change its choice); a preflop starting-hand chart, postflop play by made hand and draws, occasional bluffs from the injected random source. A `Match` runs hands, alternates the button, starts a new match when someone busts, and records every accepted move with the learner's `TableView` at that moment.
   - 5b. **Play screen**: the guided-hands table, Fold/Check/Call, a bet slider with ½ pot, pot, and all-in. Coach hints shown before the learner's move (on by default, with a switch), using only visible information: current hand, draws, pot odds when facing a bet, position. Any percentage states its assumption about the bot's cards and counts ties as half.
   - 5c. **Review screen**: the last 50 hands saved in the browser (versioned, with reset); step through a hand from the learner's view; at each learner decision show what was known, pot odds, and a comment. Judge decisions, not results.
   - 5d. **Thinking lessons** (texts in `docs/lessons.md` first, for the owner's review): why bluffing works (game theory: mixed strategies), sunk cost, resulting, and bankroll management with the Kelly criterion (betting math, not game theory; why players risk only a fraction of Kelly). Link to played hands where possible.
   - Then a Codex review of Step 5.
   - **Changes from Codex's plan review** (thread `01a18ced-7d1d-7402-ae93-038696fa396f`, "approve with changes", adopted 2026-10-30):
     - No live win-probability numbers in Step 5 (they need an opponent model; win odds stay in Step 6). Pot odds describe the *required* chance, worded like "You need 25% if this call ends the betting. We haven't estimated your chance."
     - Draws are "cards that could complete your draw," never "outs that win"; mention that some may still lose, and don't add overlapping draws twice.
     - Review explains, and judges only provable cases (e.g., folding when checking was free; folding an unbeatable river hand, checked against every possible opponent holding). Otherwise say what it depends on.
     - Pot math lives in `src/game/`: the pot a call can win includes bets in front of players but excludes opposing chips that would be refunded after a short all-in call. Slider presets for raises mean "call, then raise by that fraction of the new pot," rounded and clamped to legal moves.
     - Records are snapshots (pre- and post-move learner views, legal moves, versions), never seeds or hidden decks; at most 50 hands and about 2 MiB, oldest dropped first; storage failures keep play working in memory.
     - The bot is a documented practice heuristic with heads-up ranges (wider than full-ring), random bet sizes (½ or ⅔ pot regardless of hand), separate random streams for shuffling and the bot, and tests that changing hidden cards never changes its choice.
     - The free-play controller is separate from `GuidedRun` (which enforces scripts); share only the table renderer.
6. ✅ **Six players, live hints, and win odds.** Done 2026-10-31; Codex audit (thread `01a190fd-4499-7b80-89c5-b1869660d3b5`) found 11 issues, all fixed and verified over three rounds (including two bot-2 exploits closed and checked on fresh seeds). Plan reviewed by Codex (thread `01a190ae-3e4b-74c1-84c8-e4ab6ad825e8`, "approve with changes"); decisions confirmed by the owner on 2026-10-31:
   - **Bust-outs:** only busted bots are topped back up to 200 between hands (seats never empty; survivors keep their stacks; seats and button stay). When the learner busts, offer "Start a new practice session" (everyone back to 200, session stats reset, saved hands kept). Top-ups are recorded separately and never count as winnings. Implemented through a tested adapter operation (the engine's pending-chip mechanism alone fails after several bust-outs).
   - **Win odds:** equity against random hands, worded as an estimated *share of the pot* ("Against two random hands, your estimated share at showdown is about 38%, including shared wins. This ignores their betting and assumes nobody else folds."). A tie among n players counts 1/n. Shown apart from the call price, never as advice. Side pots need a separate estimate per eligible group. Policy-conditioned odds are deferred.
   - Odds run in a lazy-loaded worker with cancellation and request ids: about 2,500 samples (±2 points), refining toward 10,000 (±1). Sample opponents' cards and the board jointly from cards the learner can't see; never read the real deck. Exact enumeration where small (e.g. heads-up river). Fixed seeds and exact reference cases in tests.
   - **Pot math fixes first:** the amount owed must match the adapter (a short big blind still makes callers owe the full blind), and opposing chips above the learner's contribution can belong to a side pot rather than be refunded. Multiple award entries don't mean a split pot.
   - **Records v2** (before six-seat play): `learnerSeat`, `actorSeat`, seat metadata, n-seat starting stacks, per-pot awards, policy versions; v1 heads-up records migrate on load (two seats, learner 0). Test mixed versions and the largest six-seat records against the size limits.
   - **bot-2** for 6-max (bot-1 stays for heads-up): position-aware ranges, re-raise rules, a separate short-stack table, multiway postflop caution, sizes from public action history (not just current bets). Exploitability is a regression benchmark over many seeds, seats, and strategies, reported with uncertainty, not a proof. Built 2026-10-31 in `src/game/bot2.ts` (`tableBot`), first with Codex's ranges (UTG 13.4%, HJ 16.9%, CO 22.2%, BTN 34.8% of hands). Tuned against the benchmark in `src/game/bot2.test.ts`: blind stealing first won about +29 big blinds per 100 hands, so the big blind defends its button range against late opens, players behind call wider and sometimes re-raise as a bluff against late opens, and with one opponent left the bot bets 30% of the time when checked to. Codex's Step 6 audit then found raising to 7 chips won +32 per 100 hands: the defense narrowed suddenly above 3 big blinds. Defense now shrinks gradually with the raise size (the big blind defends its button range up to 3 big blinds and its cutoff range up to 6, whoever raised), and the benchmark tests steals raising to 5, 7, 10, and 16; on fresh seeds every steal size loses (−7 to −42 per 100 hands), and the other one-trick styles lose 300–400 per 100. Codex's verification then found raising small and betting half the pot whenever checked to won +42 per 100 (heads-up pots the bot gave up after the flop); with one opponent left, bot-2 now defends small bets with pairs, draws, overcards, ace-high, and some floats, sometimes raises as a bluff, and sometimes bets first; with several opponents it defends a single small bet with pairs and good draws. On fresh seeds, six variants (open 5/7/10; bet a third, half, or the full pot; every round or flop only) all lose (−4 to −33 per 100), and two of them are in the benchmark. Bots receive the hand's public moves (`PublicAction[]`) as a fourth argument. **bot-2.1** (2026-10-31, Codex consult thread `01a19164-111c-7fd3-97d5-3455997bba9f`): too few pots had three or more players (2.7% of flops), so the bot was loosened rather than adding a second bot. Opening ranges are one step wider per seat (UTG 16.9%, HJ 22.2%, CO 29.1%, BTN 47.8%), calls are wider (especially behind a caller), the small blind sometimes just completes and then defends against a raise, players call behind a learner's limp (in self-play only the small blind limps), and a lower pair calls a bet only up to a third of the pot when several players are in. Codex's review of the tuning (same thread, "request changes") found two holes, both fixed with focused tests: every small-blind limp folded to a raise to 4, and the big blind called any size of open (even an all-in) with its small-raise range; now a raise for 40%+ of the stack gets the all-in calling range, and the big blind's range narrows above 6 and 10 big blinds. `tableStats` (`src/game/table-stats.ts`, separate deal and bot random streams) measures the table shape; a test holds it, with every hand starting at 100 big blinds, to Codex's targets: flop with betting 35–50% (about 45%), 3+ players on 15–30% of those flops (about 17%), VPIP 22–28% (25%); PFR is about 16%, under Codex's provisional 17–23%, which Codex accepted. In carried-over sessions the shape is similar (41%, 17%, 24%, 16%). The benchmark takes its margin across sessions (Student's t over 10 sessions) and requires every one-trick style, including steal sizes on both sides of the defense steps (6/7, 12/13) and a flop-only continuation bet, to lose even at the top of the range; "value only", "never bluff" (pairs or better), and "all-in with good hands" are reported but may win (on fresh seeds all three were negative or inconclusive).
   - **Engine acceptance scenarios** for six-way unequal all-ins, several side pots with different winners, ties within a pot, odd chips at every button position, cumulative short raises, short blinds, and automatic run-outs, checked independently.
   - **UI:** stable seat identity, full position names, pot eligibility lists, 320–375px widths, text enlargement, folded seats with enough contrast, concise turn announcements.
   - **Order:** lesson texts (position at a full table, side pots) and the bot-2 spec → owner review → adapter/settlement tests → v2 records and migration → controller and bot-2 → table and review → odds worker → Codex audit → fixes → commit.

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
