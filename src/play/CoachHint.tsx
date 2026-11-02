import type { CoachLine } from "../game/coach";
import type { useCoachLine } from "../i18n/coach-text";
import { LocaleContext } from "../i18n/hooks";
import { CardText } from "../learn/cards";

/** One coach hint, with card names spoken in the hint's own language (a hint not translated yet keeps English names). */
export function CoachHint({ line, phrase }: { line: CoachLine; phrase: ReturnType<typeof useCoachLine> }) {
  const phrased = phrase(line);
  return (
    <li className={`topic-${line.topic}`}>
      <LocaleContext value={phrased.lang}>
        <span lang={phrased.lang}>
          <CardText text={phrased.text} />
        </span>
      </LocaleContext>
    </li>
  );
}
