// Lessons 11–14, for after the learner has played some hands. The text matches
// docs/lessons.md, which the owner reviewed.
import type { ReactNode } from "react";
import { useHands } from "../../app/hand-store";
import { C } from "../cards";
import { KellyBars, PotCompare, ResultGrid } from "../visuals";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

/** A pointer to the learner's own saved hands, when there are any. */
function YourHands({ children }: { children: ReactNode }) {
  const { hands } = useHands();
  return (
    <p className="note">
      {hands.length ? (
        <>
          {children} You have {hands.length} saved {hands.length === 1 ? "hand" : "hands"}: <a href="#/review">open Review</a>.
        </>
      ) : (
        <>
          {children} Once you've played a few hands in <a href="#/play">Play</a>, you can look back at them in Review.
        </>
      )}
    </p>
  );
}

/** Lesson 11's toy game as a small decision tree, with your result at each end. */
function BluffTree() {
  const leaf = (label: string, result: string, tone: "win" | "lose" | "zero") => (
    <li className={`leaf ${tone}`}>
      <span>{label}</span>
      <b>{result}</b>
    </li>
  );
  return (
    <figure className="diagram">
      <div className="tree">
        <div className="branch">
          <p className="node">
            <b>You have the best hand</b> (half the time)
          </p>
          <p className="node sub">You bet 50</p>
          <ul>
            {leaf("Opponent calls", "you win 150", "win")}
            {leaf("Opponent folds", "you win 100", "win")}
          </ul>
        </div>
        <div className="branch">
          <p className="node">
            <b>You have nothing</b> (half the time)
          </p>
          <p className="node sub">You check, or bluff 50</p>
          <ul>
            {leaf("Check: the cards are shown", "you win nothing", "zero")}
            {leaf("Bluff, opponent calls", "you lose 50", "lose")}
            {leaf("Bluff, opponent folds", "you win 100", "win")}
          </ul>
        </div>
      </div>
      <figcaption>
        The pot is 100 before the river bet. "Win" counts the chips you take from the middle beyond your own bet. Your
        opponent's medium hand beats nothing and loses to your best hand.
      </figcaption>
    </figure>
  );
}

export function Lesson11() {
  return (
    <>
      <p>
        <T>A bluff</T> is a bet with a hand that's probably worse, hoping better hands fold. It can seem like a trick, but
        game theory (the math of decisions against an opponent who is also thinking) shows that good play <i>needs</i> some
        bluffs.
      </p>
      <h2>A tiny game to see why</h2>
      <p>
        It's the river. The pot is 100. You either have the best possible hand or nothing at all, with equal chances, and
        your opponent knows that. Your opponent always holds a medium hand: it beats nothing and loses to your best hand.
        You may check (then the cards are shown) or bet exactly 50. If you bet, your opponent calls or folds. Nothing else
        can happen.
      </p>
      <BluffTree />
      <ul>
        <li>
          <b>If you never bluff,</b> every bet means the best hand. Your opponent simply folds to every bet, so your strong
          hands win only the 100 that was already there.
        </li>
        <li>
          <b>If you always bluff,</b> your bets mean nothing. Your opponent calls every time, and each bluff loses 50.
        </li>
        <li>
          <b>In between, there's a balance.</b> Calling costs 50 to win 150 (the pot plus your bet), so your opponent's call
          breaks even when 1 bet in 4 is a bluff. You get there by betting all your best hands and bluffing with 1 in 3 of
          your "nothing" hands. Then your opponent can't do better by always calling or always folding.
        </li>
        <li>
          <b>The same balance works the other way.</b> If your opponent calls 2 times in 3, your bluffs break even: you win
          100 one time in 3 and lose 50 two times in 3.
        </li>
      </ul>
      <p>
        Choosing between moves at random, in fixed proportions, is called a <T>mixed strategy</T>. The point isn't to be
        random for its own sake; it's to keep your bets from telling your opponent what you hold.
      </p>
      <h2>The formulas from this game</h2>
      <p>With pot P, bet B, and no other choices:</p>
      <ul>
        <li>
          A bluff breaks even when your opponent folds exactly <b>B ÷ (P + B)</b> of the time, and profits if they fold
          more often.
        </li>
        <li>
          Your opponent's calls break even when <b>B ÷ (P + 2B)</b> of your bets are bluffs.
        </li>
      </ul>
      <p>These hold only in this toy game. Real hands have many in-between holdings, more betting rounds, and ties.</p>
      <h2>Two practical lessons</h2>
      <ul>
        <li>Against someone who never folds, don't bluff. Bet your good hands bigger instead.</li>
        <li>Against someone who folds too often, bluff more. This app's bot sometimes bluffs, and so should you, occasionally.</li>
      </ul>
    </>
  );
}

export function Lesson12() {
  return (
    <>
      <p>
        <T>A sunk cost</T> is something you've already paid and can't get back. The trap: "I've already put 60 in, so I
        can't fold now."
      </p>
      <p>
        <b>Chips in the pot aren't yours anymore.</b> Folding costs no new chips. Judge the next call by what it costs and
        whether it pays on average.
      </p>
      <h2>What still matters from earlier</h2>
      <ul>
        <li>
          <b>The size of the pot.</b> The bigger the pot, the smaller the chance you need for the same call to pay off
          (Lesson 9), no matter who put the chips in.
        </li>
        <li>
          <b>What the betting told you</b> about your opponent's hand.
        </li>
      </ul>
      <PotCompare />
      <p>
        <b>A test:</b> keep everything the same (cards, pot, stacks, betting), but imagine someone else put in your earlier
        chips. Would you call? That's your answer.
      </p>
      <YourHands>In Review, look for a hand where you called on the river after betting earlier: would you have called with someone else's chips in the pot?</YourHands>
    </>
  );
}

export function Lesson13() {
  return (
    <>
      <p>
        <T>Resulting</T> means judging a decision by how it turned out. But one hand's result depends on both your decision
        and luck.
      </p>
      <ResultGrid />
      <p>
        <b>Even the best spots lose often.</b> Before the flop, <C c="Ah" /> <C c="As" /> all-in against <C c="Kc" />{" "}
        <C c="Kd" /> wins 81.1% of the time, loses 18.6%, and ties 0.4% (counted over all 1,712,304 possible boards). If you
        play that spot 10 times, you'll likely lose it at least once.
      </p>
      <h2>Why can the aces lose?</h2>
      <p>Once both are all-in, nobody can fold, but all 5 shared cards are still to come:</p>
      <ul>
        <li>
          <b>A king comes.</b> The kings become three of a kind (or better) and usually beat the pair of aces, unless the aces
          improve too, for example when an ace also comes. For example, with a board of <C c="Kh" /> <C c="7c" />{" "}
          <C c="2d" /> <C c="9s" /> <C c="4h" />, the kings have K-K-K and the aces have just a pair. This decides about 16
          boards in 100.
        </li>
        <li>
          <b>No king comes, but the kings make a straight or a flush.</b> For example, four clubs on the board give{" "}
          <C c="Kc" /> a flush, and the aces have no club. This decides about 2.6 boards in 100.
        </li>
      </ul>
      <p>
        <b>How to judge instead:</b> ask what you knew when you decided (your cards, the board, the pot, the price, the
        betting) and whether the decision made sense with that. The Review screen shows each decision this way. One result
        proves little; many results can show whether a habit works.
      </p>
      <YourHands>Review shows each of your decisions before the result, and its comments never depend on how the hand ended.</YourHands>
    </>
  );
}

export function Lesson14() {
  return (
    <>
      <p>
        <T>Your bankroll</T> is the money you set aside for a game. This app uses play chips only, but the question matters
        for any risky choice: how much of what you have should you risk at once?
      </p>
      <p>
        <T>The Kelly criterion</T> (John Kelly, 1956) gives the fraction of your current bankroll to risk on each of many
        independent, repeated bets. Assume you know your chance of winning p, you profit b for each 1 you risk, and there
        are no ties:
      </p>
      <p className="formula">
        <b>Kelly fraction = (b × p − (1 − p)) ÷ b</b>, or nothing if that's zero or less.
      </p>
      <p>
        <b>Example:</b> an even-money bet (b = 1) that wins 55% of the time. Kelly says risk (0.55 − 0.45) ÷ 1 ={" "}
        <b>10%</b> of your bankroll each time.
      </p>
      <p>
        <b>Kelly makes a bankroll grow fastest over the long run.</b> It doesn't promise short-run profit, and the swings
        are large.
      </p>
      <h2>Betting too much is worse than betting too little</h2>
      <p>
        Take 100 bets with the typical result, 55 wins and 45 losses, starting with 100. Each win multiplies your bankroll
        by (1 + the fraction you bet), and each loss by (1 − that fraction). The order doesn't change the final balance:
        multiplying gives the same answer in any order.
      </p>
      <KellyBars />
      <ul>
        <li>
          <b>Half Kelly's</b> long-run growth rate is about three-quarters of full Kelly's, with much smaller swings.
        </li>
        <li>
          <b>Twice Kelly</b> ends up about where it started, even though you won 55% of the time. Losing 20% takes you to
          80, and winning 20% from there only gets you back to 96. Its growth per bet is slightly below zero, so over
          thousands of bets it slowly shrinks (100 becomes about 25 after 10,000 bets).
        </li>
      </ul>
      <p>
        <b>Kelly is a guide, not a rule.</b> Many players risk half or a quarter of Kelly: it grows more slowly but swings
        less, and it hurts less if you've overestimated your edge. In poker you never know your exact edge, and
        overestimating it makes Kelly bet too much, which is the costly direction.
      </p>
      <p>
        <b>Don't use Kelly on single hands.</b> It's about how much of your bankroll to risk over many games, not what to
        bet in one pot. Inside a hand, use pot odds (Lesson 9). This lesson explains the math; it isn't advice about real
        money.
      </p>
    </>
  );
}
