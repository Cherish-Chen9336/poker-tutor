// Words for the coach's facts in each language. The game code
// (src/game/coach.ts) stays free of wording choices; a test proves the English
// phrasing equals the coach's English text for every line.
import type { IntlShape } from "react-intl";
import type { CoachFact, CoachLine } from "../game/coach";
import { usePage } from "./hooks";
import type { Locale } from "./locales";
import { HAND_IDS } from "./log-text";
import { en, type MessageId } from "./messages/en";

/** Phrases a fact with one language's messages. */
export function phraseFact(intl: IntlShape, fact: CoachFact): string {
  // Numbers go in as plain text, as the English coach always wrote them.
  const t = (id: MessageId, values: Record<string, string | number> = {}) =>
    intl.formatMessage({ id, defaultMessage: en[id] }, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])));
  const yes = (b: boolean) => (b ? "yes" : "no");
  const cards = (codes: string[]) => codes.map((c) => `{${c}}`).join(" ");
  switch (fact.kind) {
    case "headsUpPreflop":
      return fact.callEnds ? t("coach.huCallEnds") : t("coach.huPreflop", { button: yes(fact.button) });
    case "headsUpPostflop":
      return fact.callEnds ? t("coach.huCallEnds") : t("coach.huPostflop", { button: yes(fact.button) });
    case "preflopPosition": {
      // Two names use the language's own "and" (Japanese と); longer lists use the standard list format.
      const join = (names: string[]) =>
        names.length === 2 ? t("coach.and", { a: names[0], b: names[1] }) : intl.formatList(names, { type: "conjunction" });
      const later =
        fact.count === 1
          ? t("coach.position.only")
          : fact.rank === fact.count
            ? t("coach.position.last")
            : fact.rank === 1
              ? t("coach.position.first", { count: fact.count })
              : t("coach.position.middle", {
                  rank: fact.rank,
                  count: fact.count,
                  before: join(fact.before.map((short) => t("coach.seatRef", { short }))),
                });
      return t("coach.position.preflop", { seat: t(`seat.${fact.position}` as MessageId), short: fact.position, later });
    }
    case "postflopPosition": {
      const where = fact.mine === fact.count ? "last" : fact.mine === 1 ? "first" : "middle";
      // The opponents' count is a plural in English; it goes in as a number so the plural can choose its form.
      return intl.formatMessage(
        { id: "coach.postflop", defaultMessage: en["coach.postflop"] },
        { where, rank: String(fact.mine), count: String(fact.count), others: fact.others },
      );
    }
    case "startingHand": {
      const [a, b] = fact.cards;
      return a[0] === b[0]
        ? t("coach.startingPair", { cards: cards(fact.cards), rank: a[0] })
        : t("coach.starting", { cards: cards(fact.cards), high: a[0], low: b[0], suited: yes(a[1] === b[1]) });
    }
    case "bestFive": {
      const hand = t("coach.handName", { hand: HAND_IDS[fact.hand] ?? "other", text: fact.hand.toLowerCase() });
      return t("coach.bestFive", { cards: cards(fact.cards), hand, shared: yes(fact.shared), headsUp: yes(fact.headsUp) });
    }
    case "draw":
      return t("coach.draw", {
        count: fact.count,
        kind: fact.flush && fact.straight ? "both" : fact.flush ? "flush" : fact.straight ? "straight" : "none",
        street: fact.flop ? "flop" : "turn",
      });
    case "boardFlush":
      return t("coach.boardFlush", { count: fact.count, suit: fact.suit });
    case "boardPaired":
      return t("coach.boardPaired");
    case "boardStraight":
      return t("coach.boardStraight");
    case "free":
      return t("coach.free");
    case "price":
      return t("coach.price", {
        toCall: fact.toCall,
        pot: fact.pot,
        pct: fact.pct,
        allIn: yes(fact.allIn),
        sidePots: yes(fact.sidePots),
        ends: yes(fact.ends),
      });
  }
}

/** A coach line in the page's language: phrased from its fact, or the English text on English pages. */
export function useCoachLine() {
  const { locale, intl } = usePage();
  return (line: CoachLine): { text: string; lang: Locale } =>
    locale !== "en" && intl ? { text: phraseFact(intl, line.fact), lang: locale } : { text: line.text, lang: "en" };
}
