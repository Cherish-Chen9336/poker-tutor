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

  it("says '1 decision', not '1 decisions'", () => {
    const one = hands(30).filter((h) => h.moves.filter((m) => m.actorSeat === h.learnerSeat).length === 1);
    expect(one.length).toBeGreaterThan(0);
    store.hands = [one[0]];
    expect(text(render("en"))).toMatch(/\b1 decision by you/);
  });
});
