// Quiz wording in other languages (machine-assisted). Only the words are
// translated: which choice is correct, the cards, and the checks stay in
// quizzes.ts, so a translation can't change an answer (tested).
import type { Locale } from "../i18n/locales";
import type { Question } from "./quizzes";

export interface QuestionText {
  prompt: string;
  choices: string[];
  why: string;
}

export const QUIZ_TEXT: Record<Exclude<Locale, "en">, Record<string, QuestionText>> = {
  "zh-Hans": {
    "L1-Q1": {
      prompt: "翻牌时，你下注，另外两名玩家都弃牌。接下来会怎样？",
      choices: ["发完剩下的牌，然后每个人亮牌", "你立刻赢得底池，不需要亮牌", "这手牌重新开始"],
      why: "其他人都弃牌时，最后留下的玩家获胜，不需要摊牌。",
    },
    "L1-Q2": {
      prompt: "转牌发出后，桌上有几张公共牌？",
      choices: ["3", "4", "5"],
      why: "翻牌发出 3 张，转牌再加第 4 张。河牌发出后是 5 张。",
    },
    "L1-Q3": {
      prompt: "下注轮按什么顺序进行？",
      choices: ["翻牌前、翻牌、转牌、河牌", "翻牌、翻牌前、河牌、转牌", "翻牌前、转牌、翻牌、河牌"],
      why: "翻牌前没有公共牌。接着是翻牌（3 张）、转牌（1 张）和河牌（1 张）。",
    },
  },
  ja: {
    "L1-Q1": {
      prompt: "フロップであなたがベットし、ほかの2人がフォールドしました。どうなりますか？",
      choices: ["残りのカードが配られ、その後全員がカードを見せる", "カードを見せずに、すぐにポットを獲得する", "ハンドが最初からやり直しになる"],
      why: "ほかの全員がフォールドすると、最後に残ったプレイヤーが勝ちます。ショーダウンは必要ありません。",
    },
    "L1-Q2": {
      prompt: "ターンの後、テーブルにある共有カードは何枚ですか？",
      choices: ["3", "4", "5"],
      why: "フロップで3枚配られ、ターンで4枚目が加わります。リバーで5枚になります。",
    },
    "L1-Q3": {
      prompt: "ベッティングラウンドはどの順番で来ますか？",
      choices: ["プリフロップ、フロップ、ターン、リバー", "フロップ、プリフロップ、リバー、ターン", "プリフロップ、ターン、フロップ、リバー"],
      why: "プリフロップには共有カードがありません。その後、フロップ（3枚）、ターン（1枚）、リバー（1枚）と続きます。",
    },
  },
};

/** The question in the page's language, or null when it isn't translated yet. */
export function localizeQuestion(q: Question, locale: Locale): Question | null {
  if (locale === "en") return q;
  const text = QUIZ_TEXT[locale][q.id];
  return text ? { ...q, ...text } : null;
}
