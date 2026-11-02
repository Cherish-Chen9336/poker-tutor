// The Play screen's language handling: coach hints keep their own card-name
// language, notices are worded in the language shown now, the six-seat table
// survives a damaged saved hand, and the guided-hand words load safely.
import { renderToStaticMarkup } from "react-dom/server";
import { createIntl, IntlProvider } from "react-intl";
import { describe, expect, it, vi } from "vitest";
import { tableBot } from "../game/bot2";
import { Match } from "../game/match";
import { cardName } from "../learn/card-names";
import { CoachHint } from "../play/CoachHint";
import { noticeText } from "../play/notice";
import { RoundTable } from "../ui/RoundTable";
import { LocaleContext } from "./hooks";
import type { Locale } from "./locales";
import { en, type MessageId } from "./messages/en";
import { ja } from "./messages/ja";
import { zhHans } from "./messages/zh-Hans";

const CATALOGS: Record<Locale, Record<string, string>> = { en, "zh-Hans": { ...en, ...zhHans }, ja: { ...en, ...ja } };
const render = (locale: Locale, node: React.ReactNode) =>
  renderToStaticMarkup(
    <LocaleContext value={locale}>
      <IntlProvider locale={locale} messages={CATALOGS[locale]}>
        {node}
      </IntlProvider>
    </LocaleContext>,
  );
const tFor = (locale: Locale) => {
  const intl = createIntl({ locale, messages: CATALOGS[locale] });
  return ((id: MessageId, values?: Record<string, string>) => intl.formatMessage({ id }, values)) as never;
};

describe("Play in other languages", () => {
  for (const locale of ["zh-Hans", "ja"] as const) {
    it(`${locale}: an English coach hint names its cards in English, a translated one in ${locale}`, () => {
      const line = { topic: "hand", text: "Your cards: {As} {Kd}." } as never;
      const english = render(locale, <ul><CoachHint line={line} phrase={() => ({ text: "Your cards: {As} {Kd}.", lang: "en" })} /></ul>);
      expect(english).toContain(`aria-label="${cardName("As", "en")}"`);
      expect(english).toContain('lang="en"');
      const translated = render(locale, <ul><CoachHint line={line} phrase={() => ({ text: "{As} {Kd}", lang: locale })} /></ul>);
      expect(translated).toContain(`aria-label="${cardName("As", locale)}"`);
    });

    it(`${locale}: a notice is worded in the language shown now, not the one it was made in`, () => {
      const rejected = { kind: "rejected", reason: "It isn't this player's turn." } as const;
      expect(noticeText(rejected, "en", tFor("en"))).toBe("It isn't this player's turn.");
      expect(noticeText(rejected, locale, tFor(locale))).toBe(CATALOGS[locale]["play.rejected"]);
      expect(noticeText({ kind: "tooLong" }, locale, tFor(locale))).toBe(CATALOGS[locale]["play.tooLong"]);
    });
  }

  it("draws the six-seat table even when a saved hand's pot lists nobody", () => {
    const match = new Match({ bot: tableBot, players: 6 });
    match.dealNext();
    const view = match.view();
    const damaged = { ...view, handOver: false, pots: [{ amount: 10, eligibleSeats: [] }, { amount: 4, eligibleSeats: [0, 2] }] };
    for (const locale of ["en", "zh-Hans", "ja"] as const) {
      const html = render(locale, <RoundTable view={damaged as never} youSeat={0} names={match.seats.map((s) => s.name)} />);
      expect(html).toContain("rt-pots");
    }
  });
});

describe("loading the guided hands' words", () => {
  it("loads once, then reads without waiting", async () => {
    const { guidedText } = await import("../learn/guided-text");
    const first = guidedText("ja");
    expect(guidedText("ja")).toBe(first);
    const words = await first;
    await Promise.resolve();
    expect(first).toMatchObject({ status: "fulfilled", value: words });
  });

  it("marks a failed load as rejected, without an unhandled rejection", async () => {
    vi.resetModules();
    vi.doMock("../learn/guided-text/zh-Hans", () => Promise.reject(new Error("offline")));
    const { guidedText } = await import("../learn/guided-text");
    const promise = guidedText("zh-Hans");
    await expect(promise).rejects.toThrow();
    await Promise.resolve();
    expect(promise).toMatchObject({ status: "rejected" });
    vi.doUnmock("../learn/guided-text/zh-Hans");
  });
});
