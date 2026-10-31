// Lessons 8–10. The text matches docs/lessons.md, which the owner reviewed.
import type { ReactNode } from "react";
import { C } from "../cards";
import { GuidedHands } from "../GuidedHands";
import { PotOddsCalculator, StreakDemo } from "../thinking";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson8() {
  return (
    <>
      <p>
        You'll play 4 short hands against a bot. Each one teaches a different way a hand can end. The cards are fixed so
        the coach can walk you through each step. The coach only talks about what you can see, just like in a real game,
        and never peeks at the bot's cards.
      </p>
      <p>
        <b>Setup for every hand:</b> heads-up, blinds 1/2, both players start with 200. The hands alternate which of you
        has the button, so you practice both seats.
      </p>
      <p>
        At each step, the app asks you for one move and explains it. These moves are chosen to show each part of a hand.
        They're reasonable plays, but not always the only good ones. Random hands come in the Play area.
      </p>
      <GuidedHands />
    </>
  );
}

export function Lesson9() {
  return (
    <>
      <p>
        <b>Will a call pay off on average?</b> You'll face this question again and again. Even a call that loses this time
        can be right if it wins enough over many repeats.
      </p>
      <p>
        <T>Expected value (EV)</T> is how much a decision wins or loses on average, if you could repeat it many times.
      </p>
      <p>
        <T>Pot odds</T> compare the price of a call with the pot you could win.
      </p>
      <ul>
        <li>
          <b>P</b> = the pot, including your opponent's bet.
        </li>
        <li>
          <b>C</b> = what you must put in to call.
        </li>
        <li>
          If you call, you win <b>P + C</b> in total (the pot plus your own call back) or lose <b>C</b>.
        </li>
      </ul>
      <p>
        <b>The break-even chance</b> is <b>C ÷ (P + C)</b>. If your chance of winning is higher, calling earns more on
        average than folding.
      </p>
      <h2>An example</h2>
      <p>
        <b>The rules of this example:</b> it's heads-up on the turn, with one card to come. Your opponent has gone all-in, so
        your call ends the betting. To make the math exact, <b>we'll pretend you know your opponent's cards</b>. In real
        play you don't, but the method is the same.
      </p>
      <ul>
        <li>
          Board: <C c="Kh" /> <C c="9h" /> <C c="2c" /> <C c="3s" />. You hold <C c="7h" /> <C c="6h" />; your opponent
          holds <C c="Ks" /> <C c="Jd" /> (a pair of kings).
        </li>
        <li>
          You're behind, but any heart on the river gives you a flush. 9 hearts are left among the 44 unseen cards, and no
          other card helps you. These winning cards are called <T>outs</T>.
        </li>
        <li>
          Your chance of winning: 9 ÷ 44 ≈ <b>20.5%</b>. No river card makes a tie.
        </li>
      </ul>
      <p>
        <b>Case 1:</b> the pot is 100 (including the bet), and you must call 50. Break-even: 50 ÷ 150 = 33.3%. Your 20.5%
        is lower, so <b>fold</b>. EV of calling: 20.5% × 150 − 50 ≈ <b>−19 chips</b> per call, on average.
      </p>
      <p>
        <b>Case 2:</b> the pot is 200, and you must call 25. Break-even: 25 ÷ 225 = 11.1%. Your 20.5% is higher, so{" "}
        <b>call</b>. EV of calling: 20.5% × 225 − 25 ≈ <b>+21 chips</b> per call, on average.
      </p>
      <p>Same cards, different prices, different answers. The price matters as much as your hand. Try other amounts:</p>
      <PotOddsCalculator />
      <p>
        <b>Ties count as half</b> when two players tie: if a river card would split the pot between you and one opponent,
        count it as half a win. (With more players, a tie pays your share: a third in a three-way tie.)
      </p>
      <h2>A shortcut: the rule of 2 and 4</h2>
      <p>
        Count your outs. With one card to come, multiply by 2. With two cards to come and no more betting (for example,
        someone is all-in on the flop), multiply by 4. It's only an estimate. For a flush draw on the flop (9 outs, 47
        unseen cards, and every out a winner), 9 × 4 = 36%, while the exact chance is 35.0%. With many outs it
        overestimates more: 15 × 4 = 60%, but the exact chance is 54.1%.
      </p>
      <p>
        <b>Careful with outs:</b> some "outs" can still lose. For example, they might also give your opponent a better
        hand. The app's checks count every card exactly.
      </p>
      <p>
        <b>Later:</b> in real play, you'll also think about chips you might win or lose on later rounds (called{" "}
        <T>implied odds</T>). That comes after you've played some hands.
      </p>
    </>
  );
}

export function Lesson10() {
  return (
    <>
      <p>
        <T>The gambler's fallacy</T> is the belief that past results change the chances of the next random event: "I've
        lost five hands in a row, so I'm due a win."
      </p>
      <p>
        <b>In poker, the deck is reshuffled every hand.</b> The cards don't remember the last hand. After a losing streak,
        your chance of getting good cards in the next hand is exactly the same as always.
      </p>
      <h2>Try it</h2>
      <p>
        The app deals thousands of heads-up hands, with both players' cards shown and no betting. It looks for moments when
        a player lost three showdowns in a row, and it checks their next starting hand. Is it a <T>premium hand</T> (A-A,
        K-K, Q-Q, or A-K)?
      </p>
      <StreakDemo />
      <ul>
        <li>
          <b>The chance</b> of a premium hand is 34 out of 1,326 starting hands, about <b>2.56%</b> (1 in 39). This doesn't
          change after losses.
        </li>
        <li>
          <b>The counts will wobble.</b> Over a few hundred cases, the bar might show 2% or 3.5%. That's normal randomness,
          not a pattern. The margin-of-error line shows how much wobble to expect. As you deal more, the bars settle closer
          to 2.56% and the margin-of-error lines get shorter.
        </li>
        <li>
          The demo deals hands in groups of 4. It looks for groups where the first 3 hands were losses (a tie breaks the
          streak), then checks the 4th. This keeps every case independent.
        </li>
      </ul>
      <p>
        <b>Within one hand, though, seen cards do matter.</b> If you see 4 hearts, fewer hearts are left in the deck.
        That's how outs work in Lesson 9. The fallacy is about <i>separate</i> shuffles, not cards in the same hand.
      </p>
      <p>
        <b>Why this matters for you:</b> after a few losses, it's tempting to play worse hands because you feel "due," or
        to bet bigger to win it back. Losing streaks happen by chance, even to the best players. Judge each decision on its
        own.
      </p>
    </>
  );
}
