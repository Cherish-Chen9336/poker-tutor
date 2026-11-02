// A pointer to the learner's own saved hands, when there are any (lessons 12 and 13).
import type { ReactNode } from "react";
import { useHands } from "../app/hand-store";
import { useHref, useT } from "../i18n/hooks";

export function YourHands({ children }: { children: ReactNode }) {
  const { hands } = useHands();
  const href = useHref();
  const t = useT();
  return (
    <p className="note">
      {children}{" "}
      {hands.length
        ? t("yourHands.some", { count: hands.length, a: (chunks) => <a href={href({ area: "review" })}>{chunks}</a> })
        : t("yourHands.none", { a: (chunks) => <a href={href({ area: "play" })}>{chunks}</a> })}
    </p>
  );
}
