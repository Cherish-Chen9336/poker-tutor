// Quiz wording in Simplified Chinese (machine-assisted). Words only: which choice is correct, the cards, and the checks stay in
// quizzes.ts, so a translation can't change an answer (tested). Loaded only for this language.
import type { QuestionText } from "./types";

export const text: Record<string, QuestionText> = {
  "L1-Q1": {
    prompt: "翻牌时你下注，另外两人都弃牌。接下来会怎样？",
    choices: ["发完剩下的牌，大家亮牌", "你立刻赢得底池，无需亮牌", "这手牌重新开始"],
    why: "其他人都弃牌时，剩下的玩家直接获胜，无需摊牌。",
  },
  "L1-Q2": {
    prompt: "转牌发出后，桌上有几张公共牌？",
    choices: ["3", "4", "5"],
    why: "翻牌 3 张，转牌再加 1 张，共 4 张。河牌后是 5 张。",
  },
  "L1-Q3": {
    prompt: "下注轮的顺序是？",
    choices: ["翻牌前、翻牌、转牌、河牌", "翻牌、翻牌前、河牌、转牌", "翻牌前、转牌、翻牌、河牌"],
    why: "翻牌前没有公共牌，之后依次是翻牌（3 张）、转牌（1 张）、河牌（1 张）。",
  },
};
