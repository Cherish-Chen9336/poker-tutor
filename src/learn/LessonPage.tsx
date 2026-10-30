import type { Progress } from "../app/progress";
import { routeHref } from "../app/route";
import { findLesson, LESSONS } from "./lessons";

interface Props {
  lessonId: number;
  progress: Progress;
}

export function LessonPage({ lessonId, progress }: Props) {
  const lesson = findLesson(lessonId);
  const allLessons = routeHref({ area: "learn", lesson: null });

  if (!lesson) {
    return (
      <section className="panel">
        <h1 tabIndex={-1}>Lesson not found</h1>
        <p className="lede">
          There's no lesson {lessonId}. <a href={allLessons}>See all lessons</a>.
        </p>
      </section>
    );
  }

  const prev = findLesson(lesson.id - 1);
  const next = findLesson(lesson.id + 1);
  const finished = progress.completed.includes(lesson.id);

  return (
    <article className="panel lesson">
      <a className="back" href={allLessons}>
        ← All lessons
      </a>
      <p className="eyebrow">
        Lesson {lesson.id} of {LESSONS.length}
        {finished && <span className="status done">✓ Done</span>}
      </p>
      <h1 tabIndex={-1}>{lesson.title}</h1>
      <p className="lede">{lesson.summary}</p>
      <p className="note">This lesson's page is being built. Its text and quick checks arrive in the next update.</p>
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
            Lesson {next.id} →
          </a>
        )}
      </nav>
    </article>
  );
}
