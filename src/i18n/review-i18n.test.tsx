// The Review screen in each language: empty and filled lists, counts, links
// that keep the reader's language, and card names in the page's language.
import { renderToStaticMarkup } from "react-dom/server";
import { createIntl, IntlProvider } from "react-intl";
import { describe, expect, it, vi } from "vitest";
import { practiceBot } from "../game/bot";
import { Match, type HandRecord } from "../game/match";
import { cardName } from "../learn/card-names";
import ReviewPage from "../review/ReviewPage";
import { LocaleContext, PageContext } from "./hooks";
import type { Locale } from "./locales";
import { en } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-Hans";

const store = vi.hoisted(() => ({ hands: [] as unknown[] }));
vi.mock("../app/hand-store", () => ({ useHands: () => ({ hands: store.hands, saved: true, clear() {} }) }));
vi.mock("../app/focus", () => ({ useTakePendingFocus() {} }));

const CATALOGS: Record<Locale, Record<string, string>> = { en, "zh-Hans": { ...en, ...zhHans }, ja: { ...en, ...ja } };
function render(locale: Locale): string {
  const intl = createIntl({ locale, messages: CATALOGS[locale] });
  return renderToStaticMarkup(
    <LocaleContext value={locale}>
      <PageContext value={{ locale, intl }}>
        <IntlProvider locale={locale} messages={CATALOGS[locale]}>
          <ReviewPage />
        </IntlProvider>
      </PageContext>
    </LocaleContext>,
  );
}
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'");

/** Played heads-up hands; the first has exactly one learner decision when the learner folds at once. */
function hands(n: number): HandRecord[] {
  const match = new Match({ bot: practiceBot });
  return Array.from({ length: n }, (_, i) => {
    match.dealNext();
    let first = true;
    while (!match.handOver) {
      const legal = match.legalMoves()!;
      match.act(first && legal.call !== null ? { type: "fold" } : legal.check ? { type: "check" } : { type: "call" });
      first = false;
    }
    return { ...match.current!, id: `h${i}` } as HandRecord;
  });
}

describe("Review in every language", () => {
  for (const locale of ["en", "zh-Hans", "ja"] as const) {
    const prefix = locale === "en" ? "#/" : `#/${locale}/`;
    it(`${locale}: with no hands, links to Play in the reader's language`, () => {
      store.hands = [];
      const html = render(locale);
      expect(html).toContain(`href="${prefix}play"`);
      expect(text(html)).toContain(CATALOGS[locale]["review.empty"].replace(/'/g, "'"));
    });

    it(`${locale}: counts saved hands and names cards in the page's language`, () => {
      for (const n of [1, 2, 50]) {
        store.hands = hands(n);
        const html = render(locale);
        expect(text(html)).toContain(String(n));
        const newest = store.hands.at(-1) as HandRecord;
        const card = (newest.moves[0]?.view ?? newest.final!).seats[newest.learnerSeat]!.cards![0]!;
        expect(html).toContain(`aria-label="${cardName(card, locale)}"`);
        if (locale === "en") expect(text(html)).toMatch(n === 1 ? /\b1 hand saved/ : new RegExp(`\\b${n} hands saved`));
      }
    });
  }

  it("names a hand by table size and when it was played, not by match numbers that restart each visit", () => {
    const [hand] = hands(1);
    // Local noon, so the date is the same in every time zone the tests run in.
    store.hands = [{ ...hand, playedAt: new Date(2026, 10, 4, 12, 5).toISOString() }];
    expect(text(render("en"))).toMatch(/Heads-up · Nov 4, 12:05\sPM/);
    expect(text(render("en"))).not.toMatch(/Match \d/);
    expect(text(render("zh-Hans"))).toContain("单挑 · 11月4日 12:05");
    expect(text(render("ja"))).toContain("ヘッズアップ · 11月4日 12:05");
    // A hand saved without a valid time (storage can hold anything) still gets a title, just without the time.
    const title = (html: string) => text(html.match(/<h2 class="review-title">(.*?)<\/h2>/)![1]!);
    for (const playedAt of [undefined, "not a date", { toString: null }]) {
      store.hands = [{ ...hand, playedAt: playedAt as never }];
      const shown = title(render("en"));
      expect(shown).toMatch(/^\s*Heads-up · /);
      expect(shown).not.toMatch(/\d:\d\d|Nov/);
    }
  });

  it("says '1 decision', not '1 decisions'", () => {
    const one = hands(30).filter((h) => h.moves.filter((m) => m.actorSeat === h.learnerSeat).length === 1);
    expect(one.length).toBeGreaterThan(0);
    store.hands = [one[0]];
    expect(text(render("en"))).toMatch(/\b1 decision by you/);
  });
});
