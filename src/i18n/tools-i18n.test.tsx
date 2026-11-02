// The Lesson 9–16 tools beyond their first screen, in every language: the
// calculator's verdicts, the streak bars with results, the saved-hands note,
// and the cards in Lesson 13's grid.
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createIntl, IntlProvider } from "react-intl";
import { describe, expect, it, vi } from "vitest";
import { cardName } from "../learn/card-names";
import { averageResult, averageResultParts, LESSON9_EXAMPLE } from "../learn/diagram-data";
import { RateBar } from "../learn/thinking";
import { ResultGrid } from "../learn/visuals";
import { YourHands } from "../learn/YourHands";
import { LocaleContext, PageContext } from "./hooks";
import type { Locale } from "./locales";
import { en } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-Hans";

const saved = vi.hoisted(() => ({ count: 0 }));
vi.mock("../app/hand-store", () => ({ useHands: () => ({ hands: Array.from({ length: saved.count }, (_, i) => ({ id: i })) }) }));

const CATALOGS: Record<Locale, Record<string, string>> = { en, "zh-Hans": { ...en, ...zhHans }, ja: { ...en, ...ja } };

function render(locale: Locale, node: ReactNode): string {
  const intl = createIntl({ locale, messages: CATALOGS[locale] });
  return renderToStaticMarkup(
    <LocaleContext value={locale}>
      <PageContext value={{ locale, intl }}>
        <IntlProvider locale={locale} messages={CATALOGS[locale]}>
          {node}
        </IntlProvider>
      </PageContext>
    </LocaleContext>,
  );
}
const text = (html: string) => html.replace(/<[^>]+>/g, "");

describe("the pot-odds calculator's verdict", () => {
  const words: Record<Locale, { call: string; fold: string; even: RegExp }> = {
    en: { call: "→ call", fold: "→ fold", even: /^About break-even/ },
    "zh-Hans": { call: "→ 跟注", fold: "→ 弃牌", even: /^大约盈亏平衡/ },
    ja: { call: "→ コール", fold: "→ フォールド", even: /^ほぼ損益分岐/ },
  };
  for (const locale of ["en", "zh-Hans", "ja"] as const) {
    it(`${locale}: words gains, losses, and break-even like the English`, () => {
      const intl = createIntl({ locale, messages: CATALOGS[locale] });
      const say = (ev: number) => {
        const r = averageResultParts(ev);
        return r.even ? intl.formatMessage({ id: "calc.even" }) : intl.formatMessage({ id: "calc.result" }, r);
      };
      for (const [ev, sign, amount, verdict] of [[-19.3, "−", "19.3", "fold"], [21, "+", "21.0", "call"], [0.06, "+", "0.1", "call"], [-0.06, "−", "0.1", "fold"]] as const) {
        expect(say(ev), `${ev}`).toContain(`${sign}${amount}`);
        expect(say(ev).endsWith(words[locale][verdict]), `${ev}: ${say(ev)}`).toBe(true);
      }
      for (const ev of [0, 0.04, -0.04]) expect(say(ev)).toMatch(words[locale].even);
      if (locale === "en") for (const ev of [-19.3, 21, 0.06, 0.04]) expect(say(ev)).toBe(averageResult(ev));
    });
  }
});

describe("the streak bars", () => {
  for (const locale of ["en", "zh-Hans", "ja"] as const) {
    it(`${locale}: no cases, a filled bar, and a range beyond the chart`, () => {
      const none = text(render(locale, <RateBar label="x" hits={0} trials={0} />));
      expect(none).toContain(CATALOGS[locale]["streak.noCases"]);
      const some = text(render(locale, <RateBar label="x" hits={31} trials={1000} />));
      expect(some).toContain("1,000");
      expect(some).toContain("3.10%");
      expect(some).toMatch(/2\.2%.*4\.4%/);
      const wide = text(render(locale, <RateBar label="x" hits={10} trials={100} />));
      const beyond = CATALOGS[locale]["streak.beyond"].replace("{high}", "");
      expect(wide).toContain(beyond.trim());
    });
  }
});

describe("the saved-hands note", () => {
  for (const locale of ["en", "zh-Hans", "ja"] as const) {
    it(`${locale}: counts saved hands and links in the reader's language`, () => {
      const prefix = locale === "en" ? "#/" : `#/${locale}/`;
      saved.count = 0;
      expect(render(locale, <YourHands>Lead.</YourHands>)).toContain(`href="${prefix}play"`);
      for (const n of [1, 2, 50]) {
        saved.count = n;
        const html = render(locale, <YourHands>Lead.</YourHands>);
        expect(html).toContain(`href="${prefix}review"`);
        expect(text(html)).toContain(String(n));
        if (locale === "en") expect(text(html)).toContain(n === 1 ? "1 saved hand:" : `${n} saved hands:`);
      }
    });
  }
});

describe("Lesson 13's grid", () => {
  for (const locale of ["en", "zh-Hans", "ja"] as const) {
    it(`${locale}: names your cards, then the opponent's, then the board, in order`, () => {
      const html = render(locale, <ResultGrid />);
      const setup = html.match(/<p class="visual-setup">(.*?)<\/p>/)![1];
      const labels = [...setup.matchAll(/aria-label="([^"]+)"/g)].map((m) => m[1]);
      const { you, opponent, board } = LESSON9_EXAMPLE;
      expect(labels).toEqual([...you, ...opponent, ...board].map((c) => cardName(c, locale)));
      const order = [you[0], opponent[0], board[0]].map((c) => setup.indexOf(cardName(c, locale)));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });
  }
});
