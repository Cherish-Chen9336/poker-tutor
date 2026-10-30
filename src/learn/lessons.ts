// The lesson list. Texts and quick checks are in docs/lessons.md.

export type Unit = "rules" | "practice" | "thinking" | "afterPlay";

export interface LessonInfo {
  id: number;
  title: string;
  summary: string;
  minutes: number;
  unit: Unit;
}

export const UNITS: { id: Unit; title: string; intro: string }[] = [
  { id: "rules", title: "The rules", intro: "How a hand works, from the first cards to the showdown." },
  { id: "practice", title: "Practice", intro: "Four guided hands against a bot, with a coach at every step." },
  { id: "thinking", title: "Thinking well", intro: "The math and the mindset behind good decisions." },
  { id: "afterPlay", title: "After you've played", intro: "Four ideas that make more sense once you've played some hands in Play." },
];

export const LESSONS: LessonInfo[] = [
  { id: 1, unit: "rules", minutes: 3, title: "The goal and the flow of a hand", summary: "Chips, the pot, the four betting rounds, and the two ways to win." },
  { id: 2, unit: "rules", minutes: 4, title: "Your cards and the board", summary: "Two private cards, five shared ones, and the best five of seven." },
  { id: 3, unit: "rules", minutes: 5, title: "Hand rankings", summary: "The ten hands from royal flush to high card, and what breaks ties." },
  { id: 4, unit: "rules", minutes: 4, title: "Seats, the button, and the blinds", summary: "Who pays the blinds, who acts when, and why acting last helps." },
  { id: 5, unit: "rules", minutes: 5, title: "Your moves", summary: "Fold, check, call, bet, and raise, and why to bet at all." },
  { id: 6, unit: "rules", minutes: 3, title: "All-in", summary: "Calling with fewer chips, refunds, and running out the board." },
  { id: 7, unit: "rules", minutes: 3, title: "The showdown", summary: "Kickers, split pots, and showing or mucking cards." },
  { id: 8, unit: "practice", minutes: 8, title: "Guided practice hands", summary: "Win at showdown, fold early, win when the bot folds, and split a pot." },
  { id: 9, unit: "thinking", minutes: 5, title: "Expected value and pot odds", summary: "Whether a call pays off on average, and the rule of 2 and 4." },
  { id: 10, unit: "thinking", minutes: 4, title: "The gambler's fallacy", summary: "Why a losing streak doesn't make good cards more likely, with a live demo." },
  { id: 11, unit: "afterPlay", minutes: 5, title: "Why bluffing works", summary: "A tiny game shows why good play needs some bluffs, and how many." },
  { id: 12, unit: "afterPlay", minutes: 3, title: "Sunk cost", summary: "Chips in the pot aren't yours anymore, but the pot's size still matters." },
  { id: 13, unit: "afterPlay", minutes: 4, title: "Resulting", summary: "Why a good decision can lose, and how to judge decisions instead of results." },
  { id: 14, unit: "afterPlay", minutes: 5, title: "Bankroll and the Kelly criterion", summary: "How much to risk at once, and why betting too much is the costly mistake." },
];

export function findLesson(id: number): LessonInfo | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}
