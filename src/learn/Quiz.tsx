// The quick checks at the end of a lesson. Each question can be retried;
// after a second wrong answer the right one is shown. The lesson counts as
// done once every question has been answered correctly.
import { useEffect, useId, useRef, useState } from "react";
import { CardText } from "./cards";
import type { Question } from "./quizzes";

type Result = "correct" | "wrong" | "revealed";

function QuestionBlock({ q, number, onCorrect }: { q: Question; number: number; onCorrect: () => void }) {
  const name = useId();
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
          <span className="qnum">Question {number}</span>
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
            Check answer
          </button>
        )}
      </fieldset>
      <div className="feedback" role="status" tabIndex={-1} ref={feedbackRef}>
        {result === "correct" && (
          <p>
            <b className="good">✓ Correct.</b> <CardText text={q.why} />
          </p>
        )}
        {result === "wrong" && (
          <p>
            <b className="bad">✗ Not quite.</b> Have another look and try again.
          </p>
        )}
        {result === "revealed" && (
          <p>
            <b className="bad">✗ Not quite.</b> The answer is “<CardText text={q.choices[q.answer]} />”.{" "}
            <CardText text={q.why} /> Pick it to continue.
          </p>
        )}
      </div>
    </form>
  );
}

export function Quiz({ questions, onComplete }: { questions: Question[]; onComplete: () => void }) {
  const [solved, setSolved] = useState<Set<string>>(new Set());

  function markSolved(id: string) {
    const next = new Set(solved).add(id);
    setSolved(next);
    if (next.size === questions.length) onComplete();
  }

  return (
    <section className="quiz" aria-labelledby="quiz-title">
      <h2 id="quiz-title">Quick checks</h2>
      <p className="quiz-progress">
        {solved.size} of {questions.length} answered correctly
      </p>
      {questions.map((q, i) => (
        <QuestionBlock key={q.id} q={q} number={i + 1} onCorrect={() => markSolved(q.id)} />
      ))}
    </section>
  );
}
