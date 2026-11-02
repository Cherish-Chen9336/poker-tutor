// Words for the hand log's facts (src/game/log-facts.ts) in each language.
// Cards stay as tokens like {Ad}, which screens show as cards.
import { useIntl, type IntlShape } from "react-intl";
import type { LogFact, ResultFact, Who } from "../game/log-facts";
import { en, type MessageId } from "./messages/en";

type Values = Record<string, string | number>;

/** The evaluator's hand names, by their message ids. */
const HAND_IDS: Record<string, string> = {
  "Royal Flush": "royalFlush",
  "Straight Flush": "straightFlush",
  "Four of a Kind": "fourOfAKind",
  "Full House": "fullHouse",
  Flush: "flush",
  Straight: "straight",
  "Three of a Kind": "threeOfAKind",
  "Two Pair": "twoPair",
  "One Pair": "onePair",
  "High Card": "highCard",
};

/** Words one fact of the hand log with one language's messages. */
export function wordLog(intl: IntlShape, fact: LogFact): string {
  // Numbers go in as plain text, as the English log always wrote them ("1200", not "1,200").
  const t = (id: MessageId, values: Values = {}) =>
    intl.formatMessage({ id, defaultMessage: en[id] }, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])));
  const subject = (who: Who) => t("log.subject", { who: who.kind, name: who.kind === "player" ? who.name : "" });
  const cards = (codes: string[]) => codes.map((c) => `{${c}}`).join(" ");
  const join = (items: string[], id: MessageId) => items.reduce((a, b) => t(id, { a, b }));
  const hand = (description?: string) =>
    description ? t("log.withHand", { hand: t("log.hand", { hand: HAND_IDS[description] ?? "other", text: description.toLowerCase() }) }) : "";
  const outcome = (net: number) => t("log.outcome", { result: net > 0 ? "up" : net < 0 ? "down" : "even", amount: Math.abs(net) });
  const shares = (list: { who: Who; amount: number }[]) =>
    join(
      list.map((s) => t("log.share", { subject: subject(s.who), amount: s.amount })),
      "log.listJoin",
    );
  const result = (r: ResultFact, net: number): string => {
    switch (r.kind) {
      case "allPots":
        return t("log.winAll", { who: r.who.kind, subject: subject(r.who), pots: r.pots, total: r.total, hand: hand(r.hand), outcome: outcome(net) });
      case "pots": {
        const parts = r.pots.map((pot, i) => {
          const text =
            "split" in pot
              ? t("log.potSplit", { shares: shares(pot.split) })
              : t("log.potWin", { who: pot.winner.kind, subject: subject(pot.winner), amount: pot.amount, hand: hand(pot.hand) });
          const number = i > 0 && r.pots.length > 2 ? t("log.sideNumber", { number: i }) : "";
          return t("log.potLabel", { pot: i === 0 ? "main" : "side", number, text });
        });
        return t("log.pots", { parts: join(parts, "log.potJoin"), outcome: outcome(net) });
      }
      case "split":
        return t("log.split", { shares: shares(r.shares), outcome: outcome(net) });
      case "splitAmounts":
        return t("log.splitAmounts", { amounts: join(r.amounts.map(String), "log.and"), outcome: outcome(net) });
      case "win":
        return t("log.win", { who: r.who.kind, subject: subject(r.who), amount: r.amount, hand: hand(r.hand), outcome: outcome(net) });
    }
  };
  switch (fact.kind) {
    case "topUp":
      return t("log.topUp", { subject: subject(fact.who), amount: fact.amount });
    case "blinds":
      return t("log.blinds", {
        small: fact.small.kind,
        smallName: subject(fact.small),
        smallAmount: fact.smallAmount,
        smallAllIn: fact.smallAllIn ? "yes" : "no",
        big: fact.big.kind,
        bigName: subject(fact.big),
        bigAmount: fact.bigAmount,
        bigAllIn: fact.bigAllIn ? "yes" : "no",
      });
    case "yourCards":
      return t("log.yourCards", { cards: cards(fact.cards), hidden: fact.botHidden ? "yes" : "no" });
    case "move":
      return t("log.move", { who: fact.who.kind, subject: subject(fact.who), move: fact.move, amount: fact.amount ?? "", allIn: fact.allIn ? "yes" : "no" });
    case "deal":
      return t("log.deal", { street: fact.street, cards: cards(fact.cards) });
    case "runOut":
      return t("log.runOut", { cards: cards(fact.cards) });
    case "show":
      return t("log.show", { who: fact.who.kind, subject: subject(fact.who), cards: cards(fact.cards) });
    case "result":
      return result(fact.result, fact.net);
  }
}

/** Words log facts in the current content language. */
export function useLog() {
  const intl = useIntl();
  return (fact: LogFact) => wordLog(intl, fact);
}
