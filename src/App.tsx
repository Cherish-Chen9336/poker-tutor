import { lazy, Suspense, useEffect, useRef } from "react";
import { parseRoute, routeHref, useHash, type Route } from "./app/route";
import { focusPageHeading } from "./app/focus";
import { useProgress } from "./app/progress";
import { LearnHome } from "./learn/LearnHome";
import { findLesson } from "./learn/lessons";

// Lesson pages include the hand evaluator, which is large, so they load on first visit.
const LessonPage = lazy(() => import("./learn/LessonPage"));
// Play needs the full game engine, so it loads on first visit too.
const PlayPage = lazy(() => import("./play/PlayPage"));
const ReviewPage = lazy(() => import("./review/ReviewPage"));

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
  const { progress, saved, complete, reset } = useProgress();
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
    focusPageHeading(main.current);
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
          <Suspense fallback={<p className="loading">Loading the lesson…</p>}>
            <LessonPage key={route.lesson} lessonId={route.lesson} progress={progress} onComplete={complete} />
          </Suspense>
        )}
        {route.area === "play" && (
          <Suspense fallback={<p className="loading">Loading the table…</p>}>
            <PlayPage />
          </Suspense>
        )}
        {route.area === "review" && (
          <Suspense fallback={<p className="loading">Loading your hands…</p>}>
            <ReviewPage />
          </Suspense>
        )}
      </main>

      <footer className="foot">
        <span>A learning project. No real money, ever.</span>
        <a href="https://github.com/Cherish-Chen9336/poker-tutor">Source code</a>
      </footer>
    </div>
  );
}
