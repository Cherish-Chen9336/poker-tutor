// Quiz wording in Japanese (machine-assisted). Words only: which choice is correct, the cards, and the checks stay in
// quizzes.ts, so a translation can't change an answer (tested). Loaded only for this language.
import type { QuestionText } from "./types";

export const text: Record<string, QuestionText> = {
  "L1-Q1": {
    prompt: "フロップであなたがベットし、ほかの2人がフォールドしました。どうなりますか？",
    choices: ["残りのカードが配られ、その後全員がカードを見せる", "カードを見せずに、すぐにポットを獲得する", "ハンドが最初からやり直しになる"],
    why: "ほかの全員がフォールドすると、最後に残ったプレイヤーが勝ちます。ショーダウンは必要ありません。",
  },
  "L1-Q2": {
    prompt: "ターンが配られた後、共有カードは何枚ですか？",
    choices: ["3", "4", "5"],
    why: "フロップで3枚配られ、ターンで4枚目が加わります。リバーで5枚になります。",
  },
  "L1-Q3": {
    prompt: "ベッティングラウンドはどの順番で進みますか？",
    choices: ["プリフロップ、フロップ、ターン、リバー", "フロップ、プリフロップ、リバー、ターン", "プリフロップ、ターン、フロップ、リバー"],
    why: "プリフロップには共有カードがありません。その後、フロップ（3枚）、ターン（1枚）、リバー（1枚）と続きます。",
  },
};
