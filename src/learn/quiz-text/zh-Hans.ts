// Quiz wording in Simplified Chinese (machine-assisted). Words only: which choice is correct, the cards, and the checks stay in
// quizzes.ts, so a translation can't change an answer (tested). Loaded only for this language.
import type { QuestionText } from "./types";

export const text: Record<string, QuestionText> = {
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
};
