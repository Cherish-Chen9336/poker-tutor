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

## Teaching correctness

- Live hints may use only information the player can see.
- Odds must state their assumptions about opponents and account for ties.
- Reviews judge decisions, not results. A lucky win is not good play.

## Roadmap

1. ✅ Setup and library smoke tests (`src/engine/smoke.test.ts`)
2. Engine rules tests built from Ella's plain-English scenarios: all-ins, side pots, split pots, short raises, heads-up blinds
3. Heads-up play against one bot, with a hand-ranking guide
4. Up to 6 players, with live hints
5. Win odds and post-hand review

## Commands

- `npm test` runs the tests.
- `npm run build` type-checks the code and builds the site.
- `npm run dev` starts a local preview.
