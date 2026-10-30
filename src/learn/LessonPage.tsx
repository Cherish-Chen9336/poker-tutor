import { Suspense, useRef, useState } from "react";
import { useTakePendingFocus } from "../app/focus";
import type { Progress } from "../app/progress";
import { routeHref } from "../app/route";
import { LESSON_CONTENT } from "./content";
import { findLesson, LESSONS } from "./lessons";
import { Quiz } from "./Quiz";
import { QUIZZES } from "./quizzes";

interface Props {
  lessonId: number;
  progress: Progress;
  onComplete: (lessonId: number) => void;
}

export default function LessonPage({ lessonId, progress, onComplete }: Props) {
  const lesson = findLesson(lessonId);
  const allLessons = routeHref({ area: "learn", lesson: null });
  const [justFinished, setJustFinished] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useTakePendingFocus(heading);

  if (!lesson) {
    return (
      <section className="panel">
        <h1 tabIndex={-1} ref={heading}>Lesson not found</h1>
        <p className="lede">
          There's no lesson {lessonId}. <a href={allLessons}>See all lessons</a>.
        </p>
      </section>
    );
  }

  const prev = findLesson(lesson.id - 1);
  const next = findLesson(lesson.id + 1);
  const finished = progress.completed.includes(lesson.id);
  const Content = LESSON_CONTENT[lesson.id];
  const questions = QUIZZES[lesson.id];

  return (
    <article className="panel lesson">
      <a className="back" href={allLessons}>
        ← All lessons
      </a>
      <p className="eyebrow">
        Lesson {lesson.id} of {LESSONS.length} · {lesson.minutes} min
        {finished && <span className="status done">✓ Done</span>}
      </p>
      <h1 tabIndex={-1} ref={heading}>{lesson.title}</h1>

      {Content ? (
        <div className="prose">
          <Suspense fallback={<p className="loading">Loading the lesson…</p>}>
            <Content />
          </Suspense>
        </div>
      ) : (
        <>
          <p className="lede">{lesson.summary}</p>
          <p className="note">This lesson's page is being built. It arrives in a coming update.</p>
        </>
      )}

      {questions && (
        <Quiz
          key={lesson.id}
          questions={questions}
          onComplete={() => {
            onComplete(lesson.id);
            setJustFinished(true);
          }}
        />
      )}

      {justFinished && (
        <p className="note done-note" role="status">
          <b>✓ Lesson {lesson.id} complete.</b> {next ? "On to the next one when you're ready." : "That's every lesson!"}
        </p>
      )}

      <nav className="pager" aria-label="Lessons">
        {prev ? (
          <a className="button" href={routeHref({ area: "learn", lesson: prev.id })}>
            ← Lesson {prev.id}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a className="button primary" href={routeHref({ area: "learn", lesson: next.id })}>
            Lesson {next.id}: {next.title} →
          </a>
        )}
      </nav>
    </article>
  );
}
