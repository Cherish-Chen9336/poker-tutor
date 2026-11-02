// Words for the coach's facts in each language (translation pilot). The game
// code (src/game/coach.ts) stays free of wording choices for these lines.
import { useIntl, type IntlShape } from "react-intl";
import type { CoachFact, CoachLine } from "../game/coach";
import { useLocale } from "./hooks";
import { en, type MessageId } from "./messages/en";

/** Phrases a fact with one language's messages. */
export function phraseFact(intl: IntlShape, fact: CoachFact): string {
  const t = (id: MessageId, values?: Record<string, string | number>) => intl.formatMessage({ id, defaultMessage: en[id] }, values);
  const later =
    fact.rank === fact.count
      ? t("coach.position.last")
      : fact.rank === 1
        ? t("coach.position.first", { count: fact.count })
        : t("coach.position.middle", {
            rank: fact.rank,
            count: fact.count,
            before: intl.formatList(
              fact.before.map((short) => t("coach.seatRef", { short })),
              { type: "conjunction" },
            ),
          });
  return t("coach.position.preflop", { seat: t(`seat.${fact.position}` as MessageId), short: fact.position, later });
}

/** A coach line in the page's language: phrased from its fact when there is one, otherwise the English text. */
export function useCoachLine() {
  const locale = useLocale();
  const intl = useIntl();
  return (line: CoachLine): { text: string; lang: string } =>
    line.fact && locale !== "en" ? { text: phraseFact(intl, line.fact), lang: locale } : { text: line.text, lang: "en" };
}
