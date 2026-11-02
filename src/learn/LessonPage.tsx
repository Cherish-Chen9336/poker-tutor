import { Suspense, use, useRef, useState } from "react";
import { useTakePendingFocus } from "../app/focus";
import type { Progress } from "../app/progress";
import { EnglishFallback } from "../i18n/I18n";
import { useHref, useLocale, useT } from "../i18n/hooks";
import type { MessageId } from "../i18n/messages/en";
import { lessonContent } from "./content";
import { findLesson, LESSONS } from "./lessons";
import { Quiz } from "./Quiz";
import { QUIZZES } from "./quizzes";
import { localizeQuestion, quizText } from "./quizzes-i18n";

interface Props {
  lessonId: number;
  progress: Progress;
  onComplete: (lessonId: number) => void;
}

export default function LessonPage({ lessonId, progress, onComplete }: Props) {
  const lesson = findLesson(lessonId);
  const t = useT();
  const locale = useLocale();
  const routeHref = useHref();
  const allLessons = routeHref({ area: "learn", lesson: null });
  const [justFinished, setJustFinished] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useTakePendingFocus(heading);

  if (!lesson) {
    return (
      <section className="panel">
        <h1 tabIndex={-1} ref={heading}>
          {t("lesson.notFound")}
        </h1>
        <p className="lede">{t("lesson.notFoundBody", { id: lessonId, a: (chunks) => <a href={allLessons}>{chunks}</a> })}</p>
      </section>
    );
  }

  const prev = findLesson(lesson.id - 1);
  const next = findLesson(lesson.id + 1);
  const finished = progress.completed.includes(lesson.id);
  const content = lessonContent(lesson.id, locale);
  const Content = content?.Component;
  const english = QUIZZES[lesson.id];
  const texts = locale === "en" ? {} : use(quizText(locale));
  const localized = english?.map((q) => localizeQuestion(q, locale, texts));
  // A quiz is shown in the page's language only when every question is translated.
  const quizTranslated = !!localized && localized.every((q) => q !== null);
  const questions = quizTranslated ? (localized as typeof english) : english;

  return (
    <article className="panel lesson">
      <a className="back" href={allLessons}>
        {t("lesson.back")}
      </a>
      <p className="eyebrow">
        {t("lesson.position", { id: lesson.id, total: LESSONS.length, minutes: lesson.minutes })}
        {finished && <span className="status done">{t("home.done")}</span>}
      </p>
      <h1 tabIndex={-1} ref={heading}>
        {t(`lesson.${lesson.id}.title` as MessageId)}
      </h1>

      {content && Content ? (
        <div className="prose">
          <Suspense fallback={<p className="loading">{t("app.loadingLesson")}</p>}>
            {content.translated ? <Content /> : <EnglishFallback><Content /></EnglishFallback>}
          </Suspense>
        </div>
      ) : (
        <>
          <p className="lede">{t(`lesson.${lesson.id}.summary` as MessageId)}</p>
          <p className="note">{t("lesson.building")}</p>
        </>
      )}

      {questions && (
        <QuizIn translated={quizTranslated}>
          <Quiz
            key={lesson.id}
            questions={questions}
            onComplete={() => {
              onComplete(lesson.id);
              setJustFinished(true);
            }}
          />
        </QuizIn>
      )}

      {justFinished && (
        <p className="note done-note" role="status">
          <b>{t("lesson.complete", { id: lesson.id })}</b> {next ? t("lesson.onward") : t("lesson.allDone")}
        </p>
      )}

      <nav className="pager" aria-label={t("lesson.pager")}>
        {prev ? (
          <a className="button" href={routeHref({ area: "learn", lesson: prev.id })}>
            {t("lesson.prev", { id: prev.id })}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a className="button primary" href={routeHref({ area: "learn", lesson: next.id })}>
            {t("lesson.next", { id: next.id, title: t(`lesson.${next.id}.title` as MessageId) })}
          </a>
        )}
      </nav>
    </article>
  );
}

/** The quiz, marked as English when its translation isn't ready. */
function QuizIn({ translated, children }: { translated: boolean; children: React.ReactNode }) {
  return translated ? <>{children}</> : <EnglishFallback>{children}</EnglishFallback>;
}
