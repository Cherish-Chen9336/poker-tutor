import { useState } from "react";
import type { Progress } from "../app/progress";
import { useHref, useT } from "../i18n/hooks";
import type { MessageId } from "../i18n/messages/en";
import { LESSONS, UNITS } from "./lessons";

interface Props {
  progress: Progress;
  saved: boolean;
  onReset: () => void;
}

export function LearnHome({ progress, saved, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  const t = useT();
  const routeHref = useHref();
  const done = LESSONS.filter((lesson) => progress.completed.includes(lesson.id)).length;
  const next = LESSONS.find((lesson) => !progress.completed.includes(lesson.id));

  return (
    <div className="learn">
      <section className="panel intro">
        <h1 tabIndex={-1}>{t("home.title")}</h1>
        <p className="lede">{t("home.intro")}</p>
        <div className="progress-row">
          <div className="meter">
            <p className="meter-label">
              {t("home.progress", { done, total: LESSONS.length })}
            </p>
            <div className="bar" aria-hidden="true">
              <i style={{ width: `${(done / LESSONS.length) * 100}%` }} />
            </div>
          </div>
          {next && (
            <a className="button primary" href={routeHref({ area: "learn", lesson: next.id })}>
              {done === 0 ? t("home.start") : t("home.continue", { id: next.id })}
            </a>
          )}
        </div>
        {!saved && (
          <p className="note warn" role="status">
            {t("home.noSave")}
          </p>
        )}
      </section>

      {UNITS.map((unit) => (
        <section key={unit.id} className="unit" aria-labelledby={`unit-${unit.id}`}>
          <div className="unit-head">
            <h2 id={`unit-${unit.id}`}>{t(`unit.${unit.id}.title` as MessageId)}</h2>
            <p>{t(`unit.${unit.id}.intro` as MessageId)}</p>
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
                        <span className="visually-hidden">{t("home.lessonNumber", { id: lesson.id })}</span>
                        {t(`lesson.${lesson.id}.title` as MessageId)}
                      </span>
                      <span className="summary">{t(`lesson.${lesson.id}.summary` as MessageId)}</span>
                    </span>
                    <span className={finished ? "status done" : "status"}>
                      {finished ? t("home.done") : t("home.minutes", { minutes: lesson.minutes })}
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
              <span>{t("home.resetAsk")}</span>
              <button
                type="button"
                className="button danger"
                onClick={() => {
                  onReset();
                  setConfirming(false);
                }}
              >
                {t("home.resetYes")}
              </button>
              <button type="button" className="button" onClick={() => setConfirming(false)}>
                {t("home.cancel")}
              </button>
            </>
          ) : (
            <button type="button" className="button quiet" onClick={() => setConfirming(true)}>
              {t("home.reset")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
