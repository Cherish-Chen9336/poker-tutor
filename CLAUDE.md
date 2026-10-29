# Poker Tutor

A single-player browser app for learning Texas Hold'em from zero: the learner plays against simple bots while the app teaches through hand-ranking references, live hints, win odds, and post-hand reviews.

## Working with Ella

- Ella owns the project but does not write code. Claude writes the code; Ella makes decisions, writes plain-English test scenarios, and checks behavior.
- Explain choices in plain English and define poker and engineering terms the first time they come up.
- She is learning poker as the app is built. When a test or bug reveals a poker rule, explain the rule.
- Plan larger steps and get her approval before coding. Commit after each step once the tests pass.
- Get an independent Codex review at each milestone (`/cc-suite:review-plan`, `/cc-suite:audit`).

## Scope

- In scope: single player against 1–5 bots, in the browser only, hosted as a static site (GitHub Pages).
- Out of scope for now: multiplayer, accounts, servers, real money. Keep the game logic free of UI code so it could run on a server later.

## Stack and decisions

Decided 2026-10-28 together with Codex (thread `01a1823c-03a5-7e90-9101-798007d1ecff`).

- TypeScript + React + Vite. Vitest for tests. Oxlint for linting.
- Node 24 (see `.nvmrc`), because `@pokertools/engine` requires it. Run `nvm use` before running npm commands.
- **Engine:** `@pokertools/engine` 2.1.0, which handles dealing, betting, side pots, and refunds of uncalled bets.
- **Hand ranking:** `@pokertools/evaluator` 2.1.0. A lower score is a stronger hand.
- **Cross-check:** `pokersolver` (dev only) independently confirms the evaluator. Its types are in `src/types/pokersolver.d.ts`.
- Dependency versions are pinned exactly. Upgrade them deliberately and rerun all tests.
- Rejected options:
  - Forking PokerTH, because we would have to adapt and own a whole product that wasn't built for teaching.
  - `poker-ts`, because after a short all-in it sets the minimum raise incorrectly (`betting-round.ts:94`).

## Library rules

- Always create engines with `createBrowserEngine` from `@pokertools/engine/browser`. The default engine's shuffler uses Node's `crypto` module, which does not exist in browsers.
- The evaluator's `HandRank` is a `const enum` and `getHandRank` is not exported. Use `rankBoard` and `rankDescription` instead.
- `@pokertools` is young (7 GitHub stars). App code must access it only through an app-owned adapter, so the library could be replaced. Rules tests must pass before UI is built on top of it.
- **Local patch** (`patches/@pokertools+engine+2.1.0.patch`, reapplied by `postinstall`): `calculateSidePots` merges pot levels that have identical eligible seats. Without it, when folded players had invested different amounts, a tied pot was split level by level and odd chips went to the wrong player (14/16 instead of 15/15). The regression test is in `src/engine/rules.test.ts`. The bug was not reported upstream as of 2026-10-29. Recheck the patch whenever the library is upgraded.
- `createBrowserEngine` ignores a supplied `randomProvider`. Tests and guided lessons build fixed deals with `new PokerEngine({ randomProvider: riggedRandom(...) })` (see `src/engine/test-helpers.ts`). Normal play must keep using `createBrowserEngine`.
- Chip totals must count stacks, pots, and `currentBets`. Bets in front of players are not in `pots` until the street ends.

## Teaching correctness

- Live hints may use only information the player can see.
- Odds must state their assumptions about opponents and account for ties.
- Reviews judge decisions, not results. A lucky win is not good play.

## Roadmap

Revised 2026-10-29 after a whole-plan review with Codex.

1. ✅ Setup and library smoke tests (`src/engine/smoke.test.ts`)
2. **Visual preview:** a clickable sketch of the table and one narrated example hand, so Ella can picture the app
3. **Engine validation and adapter:** rules tests from `docs/rules-scenarios.md` (Claude verifies the expected results against the TDA rules; Ella reviews whether the explanations make sense to a beginner), plus the app-owned adapter (legal actions and amounts, player views without hidden cards, settlement, fixed deals for tests and lessons)
4. **Learn:** about six short lessons with quick checks. Cover the goal and winning when everyone else folds, 2 private vs. 5 shared cards, hand rankings, the button and blinds, actions ("raise to" vs. "raise by"), and the showdown, ending with a guided practice hand. Early lessons use fixed examples plus the evaluator; the guided hand uses the real engine through the adapter. Never build a second betting engine.
5. **Heads-up play** against one simple bot with a coach panel, plus a basic post-hand review
6. **Six players, live hints, and win odds**

Throughout the plan:
- Deploy early to GitHub Pages, and add CI on Node 24 (`npm ci`, test, lint, build).
- Build mobile-friendly layouts, keyboard controls, and card labels that don't rely on color alone.
- Save lesson progress in the browser, with a reset option.

Bots use one documented, reproducible policy that sees only that bot's cards and public information. Out of scope for v1: strategy grading, multiple bot personalities, advanced odds modeling.

The app has three areas: **Learn** (lessons), **Play** (a table against bots with a coach), and **Review** (a replay of each hand with explanations).

## Commands

- `npm test` runs the tests.
- `npm run build` type-checks the code and builds the site.
- `npm run dev` starts a local preview.
