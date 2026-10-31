import { useState } from "react";
import type { Progress } from "../app/progress";
import { routeHref } from "../app/route";
import { LESSONS, UNITS } from "./lessons";

interface Props {
  progress: Progress;
  saved: boolean;
  onReset: () => void;
}

export function LearnHome({ progress, saved, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  const done = LESSONS.filter((lesson) => progress.completed.includes(lesson.id)).length;
  const next = LESSONS.find((lesson) => !progress.completed.includes(lesson.id));

  return (
    <div className="learn">
      <section className="panel intro">
        <h1 tabIndex={-1}>Learn Texas Hold'em</h1>
        <p className="lede">
          Ten short lessons take you from zero to playing your first hands, four more help once you've played some, and
          two prepare you for the six-player table. Each one ends with a few quick questions, and every answer explains why.
        </p>
        <div className="progress-row">
          <div className="meter">
            <p className="meter-label">
              <b>{done}</b> of {LESSONS.length} lessons done
            </p>
            <div className="bar" aria-hidden="true">
              <i style={{ width: `${(done / LESSONS.length) * 100}%` }} />
            </div>
          </div>
          {next && (
            <a className="button primary" href={routeHref({ area: "learn", lesson: next.id })}>
              {done === 0 ? "Start lesson 1" : `Continue: lesson ${next.id}`}
            </a>
          )}
        </div>
        {!saved && (
          <p className="note warn" role="status">
            This browser isn't letting the app save. Your progress will be kept only until you close this page.
          </p>
        )}
      </section>

      {UNITS.map((unit) => (
        <section key={unit.id} className="unit" aria-labelledby={`unit-${unit.id}`}>
          <div className="unit-head">
            <h2 id={`unit-${unit.id}`}>{unit.title}</h2>
            <p>{unit.intro}</p>
          </div>
          <ol className="lesson-list">
            {LESSONS.filter((lesson) => lesson.unit === unit.id).map((lesson) => {
              const finished = progress.completed.includes(lesson.id);
              return (
                <li key={lesson.id}>
                  <a className="lesson-card" href={routeHref({ area: "learn", lesson: lesson.id })}>
                    <span className="num" aria-hidden="true">
                      {lesson.id}
                    </span>
                    <span className="body">
                      <span className="title">
                        <span className="visually-hidden">Lesson {lesson.id}: </span>
                        {lesson.title}
                      </span>
                      <span className="summary">{lesson.summary}</span>
                    </span>
                    <span className={finished ? "status done" : "status"}>
                      {finished ? "✓ Done" : `${lesson.minutes} min`}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {done > 0 && (
        <div className="reset">
          {confirming ? (
            <>
              <span>Clear all lesson progress?</span>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  onReset();
                  setConfirming(false);
                }}
              >
                Yes, start over
              </button>
              <button type="button" className="button" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="button quiet" onClick={() => setConfirming(true)}>
              Reset progress
            </button>
          )}
        </div>
      )}
    </div>
  );
}
