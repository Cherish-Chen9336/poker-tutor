// Words for the Review screen's comments (facts from src/game/review.ts) in each language.
import { useIntl, type IntlShape } from "react-intl";
import type { CommentFact } from "../game/review";
import { en, type MessageId } from "./messages/en";

/** Words one comment with one language's messages. */
export function wordComment(intl: IntlShape, fact: CommentFact): string {
  // Numbers go in as plain text, as the English comments always wrote them.
  const t = (id: MessageId, values: Record<string, string | number> = {}) =>
    intl.formatMessage({ id, defaultMessage: en[id] }, Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])));
  switch (fact.kind) {
    case "freeFold":
      return t("comment.freeFold");
    case "unbeatableFold":
      return t("comment.unbeatableFold");
    case "unbeatable":
      return t("comment.unbeatable");
    case "note": {
      const parts = fact.parts.map((part) => {
        switch (part.kind) {
          case "price":
            return t("comment.price", { toCall: part.toCall, pot: part.pot, pct: part.pct });
          case "draw":
            return t("comment.draw", { count: part.count });
          case "size":
            return t("comment.size", { added: part.added, share: part.share, pot: part.pot });
          case "foldDepends":
            return t("comment.foldDepends");
          case "callDepends":
            return t("comment.callDepends");
          case "checkFree":
            return t("comment.checkFree");
        }
      });
      if (parts.length) return parts.reduce((a, b) => t("comment.join", { a, b }));
      const move = fact.chose;
      const amount = move.type === "call" ? (fact.call ?? "") : "to" in move ? move.to : "";
      const phrase = t("move.phrase", { move: move.type === "call" && fact.call === null ? "callNone" : move.type, amount });
      return t("comment.chose", { move: phrase });
    }
  }
}

/** Words comments in the current content language. */
export function useComment() {
  const intl = useIntl();
  return (fact: CommentFact) => wordComment(intl, fact);
}
