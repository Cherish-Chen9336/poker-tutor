import type { ReactNode } from "react";
import { routeHref } from "./route";

export function ComingSoon({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h1 tabIndex={-1}>{title}</h1>
      <p className="lede">{children}</p>
      <p className="note">
        Coming soon. Meanwhile, start with the <a href={routeHref({ area: "learn", lesson: null })}>lessons</a>.
      </p>
    </section>
  );
}
