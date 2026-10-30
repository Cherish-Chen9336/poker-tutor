# Poker Tutor

A browser app for learning No-Limit Texas Hold'em from zero: short lessons, then play against simple bots with a coach that explains each decision.

Work in progress. See `CLAUDE.md` for the roadmap and `docs/rules-scenarios.md` for the poker rules the engine is tested against.

## Run it locally

Needs Node 24 (`nvm use`).

```sh
npm ci
npm run dev
```

`npm test` runs the tests, `npm run lint` checks the code style, and `npm run build` builds the site into `dist/`.

Game rules come from [`@pokertools/engine`](https://www.npmjs.com/package/@pokertools/engine) with a small local patch (`patches/`).
