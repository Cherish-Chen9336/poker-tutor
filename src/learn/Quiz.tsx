// The quick checks at the end of a lesson. Each question can be retried;
// after a second wrong answer the right one is shown. The lesson counts as
// done once every question has been answered correctly.
import { useEffect, useId, useRef, useState } from "react";
import { useT } from "../i18n/hooks";
import { CardText } from "./cards";
import type { Question } from "./quizzes";

type Result = "correct" | "wrong" | "revealed";

function QuestionBlock({ q, number, onCorrect }: { q: Question; number: number; onCorrect: () => void }) {
  const name = useId();
  const t = useT();
  const [choice, setChoice] = useState<number | null>(null);
  const [misses, setMisses] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const solved = result === "correct";
  const feedbackRef = useRef<HTMLDivElement>(null);

  // A correct answer removes the focused "Check answer" button, so move focus to the explanation.
  useEffect(() => {
    if (solved) feedbackRef.current?.focus();
  }, [solved]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (choice === null || solved) return;
    if (choice === q.answer) {
      setResult("correct");
      onCorrect();
    } else {
      setMisses(misses + 1);
      setResult(misses + 1 >= 2 ? "revealed" : "wrong");
    }
  }

  return (
    <form className={`question ${result ?? ""}`} onSubmit={submit}>
      <fieldset disabled={solved}>
        <legend>
          <span className="qnum">{t("quiz.question", { number })}</span>
          <CardText text={q.prompt} />
        </legend>
        <div className="choices">
          {q.choices.map((text, i) => (
            <label key={i} className={solved && i === q.answer ? "choice right" : "choice"}>
              <input
                type="radio"
                name={name}
                checked={choice === i}
                onChange={() => {
                  setChoice(i);
                  if (result === "wrong") setResult(null);
                }}
              />
              <span>
                <CardText text={text} />
              </span>
            </label>
          ))}
        </div>
        {!solved && (
          <button type="submit" className="button primary" disabled={choice === null}>
            {t("quiz.check")}
          </button>
        )}
      </fieldset>
      <div className="feedback" role="status" tabIndex={-1} ref={feedbackRef}>
        {result === "correct" && (
          <p>
            <b className="good">{t("quiz.correct")}</b> <CardText text={q.why} />
          </p>
        )}
        {result === "wrong" && (
          <p>
            <b className="bad">{t("quiz.wrong")}</b> {t("quiz.tryAgain")}
          </p>
        )}
        {result === "revealed" && (
          <p>
            <b className="bad">{t("quiz.wrong")}</b> {t("quiz.answerIs", { answer: <CardText text={q.choices[q.answer]} /> })}{" "}
            <CardText text={q.why} /> {t("quiz.pickIt")}
          </p>
        )}
      </div>
    </form>
  );
}

export function Quiz({ questions, onComplete }: { questions: Question[]; onComplete: () => void }) {
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const t = useT();

  function markSolved(id: string) {
    const next = new Set(solved).add(id);
    setSolved(next);
    if (next.size === questions.length) onComplete();
  }

  return (
    <section className="quiz" aria-labelledby="quiz-title">
      <h2 id="quiz-title">{t("quiz.title")}</h2>
      <p className="quiz-progress">{t("quiz.progress", { solved: solved.size, total: questions.length })}</p>
      {questions.map((q, i) => (
        <QuestionBlock key={q.id} q={q} number={i + 1} onCorrect={() => markSolved(q.id)} />
      ))}
    </section>
  );
}
