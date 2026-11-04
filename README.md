# Poker Tutor

A browser app for learning No-Limit Texas Hold'em from zero. **Try it: https://cherish-chen9336.github.io/poker-tutor/**

- **Learn:** 16 short lessons with diagrams and quick checks, from the rules and hand rankings to pot odds, position, side pots, and thinking traps like the gambler's fallacy.
- **Play:** heads-up against one bot or at a six-seat table, with a coach that explains your situation before each move (only from what you can see) and estimates your share of the pot.
- **Review:** step through up to your last 50 saved hands, with comments on each of your decisions that judge the decision, not the result.

In English, Simplified Chinese, and Japanese (machine-assisted translations). Practice only: no real money, ever.

See `CLAUDE.md` for how it was planned and built, and `docs/rules-scenarios.md` for the poker rules the engine is tested against.

## Privacy

There are no accounts and no server of ours. Lesson progress, saved hands, the language choice, and the coach switch are kept in your browser's local storage, and you can reset lesson progress on the Learn page, delete saved hands on the Review page, or clear the site's data in your browser. Visits are counted with [GoatCounter](https://www.goatcounter.com/help/privacy) (`src/app/analytics.ts`, only on the published site): it sets no cookies, stores nothing in the browser, and keeps only totals per page (the referring site, browser, system, language, screen width, and country), not individual visits. The site is hosted on GitHub Pages, loads fonts from Google Fonts, and sends visits to GoatCounter; like any web server, they receive your IP address. GoatCounter doesn't save it to disk; it holds it (with the browser's identification) in memory for up to 8 hours so a visitor isn't counted twice. "Only totals" holds while the GoatCounter setting to collect individual pageviews stays off (the default).

The visit counts are at https://poker-tutor.goatcounter.com/ (sign-in needed). To stop counting your own visits in a browser, open https://cherish-chen9336.github.io/poker-tutor/#toggle-goatcounter there once (open it again to undo); this saves one setting in that browser only.

## Run it locally

Needs Node 24 (`nvm use`).

```sh
npm ci
npm run dev
```

`npm test` runs the tests, `npm run lint` checks the code style, and `npm run build` builds the site into `dist/`.

Game rules come from [`@pokertools/engine`](https://www.npmjs.com/package/@pokertools/engine) with a small local patch (`patches/`).

## License

© 2026 Cherish-Chen9336.

- **Code** (everything that runs: components, game logic, tests, styles, build files) is under the [MIT License](LICENSE).
- **Educational content** (lesson text, quizzes and their explanations, coach and review wording, the Chinese and Japanese translations of that content, and diagram artwork) is under [Creative Commons Attribution 4.0](LICENSE-CC-BY-4.0.txt) (CC BY 4.0). Some of it sits in code files; that text is CC BY 4.0, and the code around it is MIT. Diagram rendering and interaction code is MIT; the diagram artwork is CC BY 4.0.
- **Third-party libraries and fonts** keep their own licenses. The built site lists the bundled libraries in `third-party-licenses.txt`; the fonts (Bodoni Moda, IBM Plex Mono, Instrument Sans) are served by Google Fonts under the SIL Open Font License 1.1. The poker engine carries a small local patch (`patches/`) and stays under its MIT license.

To credit the content, for example: “Based on [Poker Tutor](https://github.com/Cherish-Chen9336/poker-tutor) by Cherish-Chen9336, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)”, and say what you changed.

The Chinese and Japanese text is machine-assisted: Claude translated it and Codex cross-checked it; no human translator reviewed it. English is the reference.
