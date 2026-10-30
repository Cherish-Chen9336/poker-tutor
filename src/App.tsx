import { useEffect, useRef } from "react";
import { parseRoute, routeHref, useHash, type Route } from "./app/route";
import { useProgress } from "./app/progress";
import { ComingSoon } from "./app/ComingSoon";
import { LearnHome } from "./learn/LearnHome";
import { LessonPage } from "./learn/LessonPage";
import { findLesson } from "./learn/lessons";

const AREAS: { area: Route["area"]; label: string }[] = [
  { area: "learn", label: "Learn" },
  { area: "play", label: "Play" },
  { area: "review", label: "Review" },
];

function pageTitle(route: Route): string {
  if (route.area === "learn") {
    const lesson = route.lesson === null ? undefined : findLesson(route.lesson);
    return lesson ? `${lesson.title} · Poker Tutor` : "Learn · Poker Tutor";
  }
  return `${route.area === "play" ? "Play" : "Review"} · Poker Tutor`;
}

export default function App() {
  const hash = useHash();
  const route = parseRoute(hash);
  const { progress, saved, reset } = useProgress();
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // After moving to another page, start at the top and move keyboard and
  // screen-reader focus to the new page's heading.
  useEffect(() => {
    document.title = pageTitle(parseRoute(hash));
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    main.current?.querySelector<HTMLElement>("h1")?.focus();
  }, [hash]);

  return (
    <div className="shell">
      <header className="top">
        <a className="brand" href={routeHref({ area: "learn", lesson: null })}>
          Poker Tutor
        </a>
        <nav className="tabs" aria-label="App areas">
          {AREAS.map(({ area, label }) => (
            <a
              key={area}
              href={routeHref(area === "learn" ? { area, lesson: null } : { area })}
              aria-current={route.area === area ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main ref={main}>
        {route.area === "learn" && route.lesson === null && (
          <LearnHome progress={progress} saved={saved} onReset={reset} />
        )}
        {route.area === "learn" && route.lesson !== null && (
          <LessonPage lessonId={route.lesson} progress={progress} />
        )}
        {route.area === "play" && (
          <ComingSoon title="Play">
            Play heads-up against a bot, with a coach that explains each decision. This comes after the lessons.
          </ComingSoon>
        )}
        {route.area === "review" && (
          <ComingSoon title="Review">
            Replay your hands step by step, with explanations of each decision. This comes together with Play.
          </ComingSoon>
        )}
      </main>

      <footer className="foot">
        <span>A learning project. No real money, ever.</span>
        <a href="https://github.com/Cherish-Chen9336/poker-tutor">Source code</a>
      </footer>
    </div>
  );
}
