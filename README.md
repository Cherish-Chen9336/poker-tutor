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

## License

© 2026 Cherish-Chen9336.

- **Code** (everything that runs: components, game logic, tests, styles, build files) is under the [MIT License](LICENSE).
- **Educational content** (lesson text, quizzes and their explanations, coach and review wording, the Chinese and Japanese translations of that content, and diagram artwork) is under [Creative Commons Attribution 4.0](LICENSE-CC-BY-4.0.txt) (CC BY 4.0). Some of it sits in code files; that text is CC BY 4.0, and the code around it is MIT. Diagram rendering and interaction code is MIT; the diagram artwork is CC BY 4.0.
- **Third-party libraries and fonts** keep their own licenses. The built site lists the bundled libraries in `third-party-licenses.txt`; the fonts (Bodoni Moda, IBM Plex Mono, Instrument Sans) are served by Google Fonts under the SIL Open Font License 1.1. The poker engine carries a small local patch (`patches/`) and stays under its MIT license.

To credit the content, for example: “Based on [Poker Tutor](https://github.com/Cherish-Chen9336/poker-tutor) by Cherish-Chen9336, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)”, and say what you changed.

The Chinese and Japanese text is machine-assisted: Claude translated it and Codex cross-checked it; no human translator reviewed it. English is the reference.
