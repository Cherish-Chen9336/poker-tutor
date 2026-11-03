import { lazy, Suspense, useEffect, useRef } from "react";
import { parseLocation, routeHref, useHash, type Route } from "./app/route";
import { I18nProvider, LanguageErrorBoundary, LanguageSwitch, LoadingLanguage, MachineLabel } from "./i18n/I18n";
import { useHref, useT } from "./i18n/hooks";
import type { MessageId } from "./i18n/messages/en";
import { focusPageHeading } from "./app/focus";
import { useProgress } from "./app/progress";
import { LearnHome } from "./learn/LearnHome";
import { findLesson } from "./learn/lessons";
import { Loading } from "./ui/Loading";

// Lesson pages include the hand evaluator, which is large, so they load on first visit.
const LessonPage = lazy(() => import("./learn/LessonPage"));
// Play needs the full game engine, so it loads on first visit too.
const PlayPage = lazy(() => import("./play/PlayPage"));
const ReviewPage = lazy(() => import("./review/ReviewPage"));

const AREAS: { area: Route["area"]; label: MessageId }[] = [
  { area: "learn", label: "app.learn" },
  { area: "play", label: "app.play" },
  { area: "review", label: "app.review" },
];

export default function App() {
  const { locale, route } = parseLocation(useHash());
  return (
    <LanguageErrorBoundary locale={locale} englishHref={routeHref(route)}>
      <Suspense fallback={<LoadingLanguage />}>
        <I18nProvider locale={locale}>
          <Shell />
        </I18nProvider>
      </Suspense>
    </LanguageErrorBoundary>
  );
}

function Shell() {
  const hash = useHash();
  const { route } = parseLocation(hash);
  const t = useT();
  const href = useHref();
  const page =
    route.area === "learn"
      ? route.lesson !== null && findLesson(route.lesson)
        ? t(`lesson.${route.lesson}.title` as MessageId)
        : t("app.learn")
      : t(route.area === "play" ? "app.play" : "app.review");
  const title = t("app.title", { page });
  const { progress, saved, complete, reset } = useProgress();
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // After moving to another page, start at the top and move keyboard and
  // screen-reader focus to the new page's heading.
  useEffect(() => {
    document.title = title;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    focusPageHeading(main.current);
  }, [hash, title]);

  return (
    <div className="shell">
      <header className="top">
        <a className="brand" href={href({ area: "learn", lesson: null })}>
          {t("app.brand")}
        </a>
        <nav className="tabs" aria-label={t("app.areas")}>
          {AREAS.map(({ area, label }) => (
            <a
              key={area}
              href={href(area === "learn" ? { area, lesson: null } : { area })}
              aria-current={route.area === area ? "page" : undefined}
            >
              {t(label)}
            </a>
          ))}
        </nav>
      </header>
      <div className="lang-bar">
        <LanguageSwitch route={route} />
        <MachineLabel />
      </div>

      <main ref={main}>
        {route.area === "learn" && route.lesson === null && (
          <LearnHome progress={progress} saved={saved} onReset={reset} />
        )}
        {route.area === "learn" && route.lesson !== null && (
          <Suspense fallback={<Loading>{t("app.loadingLesson")}</Loading>}>
            <LessonPage key={route.lesson} lessonId={route.lesson} progress={progress} onComplete={complete} />
          </Suspense>
        )}
        {route.area === "play" && (
          <Suspense fallback={<Loading>{t("app.loadingTable")}</Loading>}>
            <PlayPage />
          </Suspense>
        )}
        {route.area === "review" && (
          <Suspense fallback={<Loading>{t("app.loadingHands")}</Loading>}>
            <ReviewPage />
          </Suspense>
        )}
      </main>

      <footer className="foot">
        <span>{t("app.footer")}</span>
        <a href="https://github.com/Cherish-Chen9336/poker-tutor">{t("app.source")}</a>
      </footer>
    </div>
  );
}
