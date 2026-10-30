// After moving to another page, keyboard and screen-reader focus goes to the
// new page's heading. A page that loads later (see App's lazy LessonPage)
// takes the focus when its heading appears.
import { useEffect, type RefObject } from "react";

let pending = false;

export function focusPageHeading(main: HTMLElement | null): void {
  const heading = main?.querySelector<HTMLElement>("h1");
  pending = !heading;
  heading?.focus();
}

/** For headings of pages that load after navigation. */
export function useTakePendingFocus(heading: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (pending && heading.current) {
      pending = false;
      heading.current.focus();
    }
  }, [heading]);
}
