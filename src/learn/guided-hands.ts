// Lesson 8's guided hands (docs/lessons.md). Each is a fixed deal plus the
// full sequence of moves, played through the real engine. The coach's words
// may only use what the learner can see; guided-hands.test.ts checks that no
// coach line before the showdown names the bot's cards.
import type { Move } from "../game/types";

export const YOU = "you";
export const BOT = "bot";
type Who = typeof YOU | typeof BOT;

export interface ScriptStep {
  who: Who;
  move: Move;
  /** For the learner's moves: what the coach says before asking for the move. */
  coach?: string;
}

export interface GuidedHand {
  id: number;
  title: string;
  /** Seat 0 has the button (and the small blind, heads-up). */
  youSeat: 0 | 1;
  /** Hole cards for seat 0 and seat 1. */
  hands: [string[], string[]];
  board: string[];
  script: ScriptStep[];
  /** Shown when the hand is over. */
  ending: string;
  /** Chips the learner wins (+) or loses (−); checked by the tests. */
  expectedNet: number;
}

const raiseTo = (to: number): Move => ({ type: "raise", to });
const betTo = (to: number): Move => ({ type: "bet", to });
const call: Move = { type: "call" };
const check: Move = { type: "check" };
const fold: Move = { type: "fold" };

export const GUIDED_HANDS: GuidedHand[] = [
  {
    id: 1,
    title: "Winning at the showdown",
    youSeat: 0,
    hands: [["As", "Kd"], ["Qc", "Jc"]],
    board: ["Ad", "8c", "4s", "9h", "2c"],
    script: [
      { who: YOU, move: raiseTo(6), coach: "You posted the small blind (1), and the bot posted the big blind (2). As the button, you act first. A-K is one of the strongest starting hands. Let's raise to 6." },
      { who: BOT, move: call },
      { who: BOT, move: check },
      { who: YOU, move: betTo(8), coach: "You made a pair of aces with a king kicker, which is very strong on this board. Bet to build the pot." },
      { who: BOT, move: call },
      { who: BOT, move: check },
      { who: YOU, move: check, coach: "Checking is fine too. It keeps the pot smaller, and you act last on the river anyway." },
      { who: BOT, move: betTo(14) },
      { who: YOU, move: call, coach: "Your opponent's bet doesn't tell you their cards. Bots and people sometimes bet with weak hands (a bluff). You'd need to win more than 1 time in 4 for this call to pay off. That's Lesson 9." },
    ],
    ending: "The bot was bluffing. Notice that its calls earlier didn't mean it had a strong hand. Your pair of aces wins the 56-chip pot, and you end the hand 28 chips up.",
    expectedNet: 28,
  },
  {
    id: 2,
    title: "Folding early",
    youSeat: 1,
    hands: [["Ah", "Kh"], ["7c", "2d"]],
    board: ["Qs", "Jd", "5c", "8h", "3s"],
    script: [
      { who: BOT, move: raiseTo(6) },
      { who: YOU, move: fold, coach: "7-2 with different suits is one of the weakest starting hands. Calling would cost 4 more chips with a hand that rarely wins. Folding loses only the 2 you already posted." },
    ],
    ending: "Folding weak hands early is how good players save chips. You lost 2, not more. The bot's extra 4 chips that you didn't match came back to it. Its cards stay hidden: when everyone folds, the winner doesn't show.",
    expectedNet: -2,
  },
  {
    id: 3,
    title: "Winning when the bot folds",
    youSeat: 0,
    hands: [["9s", "9d"], ["Jd", "8d"]],
    board: ["Kc", "7h", "3s", "2d", "5c"],
    script: [
      { who: YOU, move: raiseTo(6), coach: "You have the button, so you act first. A pair of nines is a good starting hand. Raise to 6." },
      { who: BOT, move: call },
      { who: BOT, move: check },
      { who: YOU, move: betTo(6), coach: "There's a king on the board, so your nines aren't the top pair, but they're still a pair. Many hands the bot could hold missed this flop. A bet of half the pot may win it right now." },
      { who: BOT, move: fold },
    ],
    ending: "You won the 12-chip pot without a showdown: 6 chips profit. The turn and river are never dealt, and nobody shows cards.",
    expectedNet: 6,
  },
  {
    id: 4,
    title: "A split pot",
    youSeat: 1,
    hands: [["Ah", "3s"], ["Ad", "4c"]],
    board: ["As", "Kc", "Ks", "Qd", "Jh"],
    script: [
      { who: BOT, move: call },
      { who: YOU, move: check, coach: "The bot called 1 more chip to match your big blind. Nobody raised, so you have the big blind's option: check or raise. Let's check and see the flop." },
      { who: YOU, move: check, coach: "You have two pair, aces and kings. You act first now. Let's check and see what the bot does." },
      { who: BOT, move: betTo(4) },
      { who: YOU, move: call, coach: "Your hand is good, but a bot with a king would have three kings or better. Calling keeps the pot small." },
      { who: YOU, move: check, coach: "The turn brings a queen. Let's check." },
      { who: BOT, move: check },
      { who: YOU, move: check, coach: "The river brings a jack. Check once more." },
      { who: BOT, move: check },
    ],
    ending: "Both best hands are A-A-K-K-Q: the ace from each hand plus the board. Your 4 and the bot's 3 don't play, so the pot is split, 6 each. You end the hand even. When the board gives everyone the same kickers, equal hands split the pot.",
    expectedNet: 0,
  },
];
