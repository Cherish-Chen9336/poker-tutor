// Lessons 1–7. The text matches docs/lessons.md, which the owner reviewed.
import type { ReactNode } from "react";
import { C } from "../cards";
import { AllInRefund, BestFiveRows, KickerCompare, RaiseToBy, RankLadder, SeatMap, StreetTimeline } from "../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson1() {
  return (
    <>
      <p>
        <b>The goal is to win chips.</b> Each hand, players put chips into a shared pile in the middle called the{" "}
        <T>pot</T>. Whoever wins the hand takes the pot. The chips you have in front of you are your <T>stack</T>.
      </p>
      <h2>Two ways to win a pot</h2>
      <ol>
        <li>
          <b>Everyone else folds.</b> To <T>fold</T> means to give up the hand. If every other player folds, you win the
          pot at once. You don't even show your cards. This happens in many hands.
        </li>
        <li>
          <b>The showdown.</b> If two or more players are still in after the last betting round, they turn their cards
          face up. The best five-card hand wins.
        </li>
      </ol>
      <p>So you can win with the best cards, or by making everyone else give up. Most of poker is deciding which hands to keep playing.</p>
      <h2>A hand has four betting rounds</h2>
      <p>Between them, shared cards are dealt face up in the middle of the table:</p>
      <StreetTimeline />
      <p>
        After each deal there's a betting round. In it, players take turns choosing to bet, match a bet, or fold (Lesson 5
        explains each move). A betting round ends when everyone still in has put in the same amount, or is all-in. Then the
        next card comes.
      </p>
      <p>
        <b>Before any cards are dealt,</b> two players must put in forced bets called <T>blinds</T>, so there's always
        something to win. Lesson 4 explains who pays them.
      </p>
    </>
  );
}

export function Lesson2() {
  return (
    <>
      <p>
        You get <b>2 private cards</b> (your <T>hole cards</T>). Nobody else sees them. The <b>5 shared cards</b> in the
        middle are called the <T>board</T>, and everyone can use them.
      </p>
      <p>
        <b>Your hand is the best 5 cards out of these 7.</b> You can use both hole cards, just one, or even none:
      </p>
      <BestFiveRows />
      <ul>
        <li>
          <b>Both cards:</b> You hold <C c="5c" /> <C c="5d" />, and the board is <C c="5h" /> <C c="Kd" /> <C c="9c" />{" "}
          <C c="2s" /> <C c="3d" />. Your best hand is three fives plus K and 9.
        </li>
        <li>
          <b>One card:</b> You hold <C c="Ah" /> <C c="3c" />, and the board is <C c="Kh" /> <C c="9h" /> <C c="6h" />{" "}
          <C c="2h" /> <C c="Ts" />. Your best hand is a flush in hearts: <C c="Ah" /> plus the board's four hearts. Your{" "}
          <C c="3c" /> doesn't count.
        </li>
        <li>
          <b>No cards ("playing the board"):</b> You hold <C c="Js" /> <C c="Jd" />, and the board is <C c="As" />{" "}
          <C c="Ad" /> <C c="Kc" /> <C c="Kh" /> <C c="Qs" />. The best hand is A-A-K-K-Q, which is all on the board. Your
          pair of jacks doesn't help, because a hand has only 5 cards. An opponent holding <C c="3c" /> <C c="2d" /> has
          exactly the same hand, so you'd split the pot.
        </li>
      </ul>
      <h2>Read the board for what's possible</h2>
      <p>
        Every player shares the same board, so ask: "What's the best hand anyone could have here?" The best possible hand on
        a given board is called <T>the nuts</T>. On <C c="Ks" /> <C c="9h" /> <C c="4c" /> <C c="2d" /> <C c="7s" />,
        nobody can have a straight or a flush, and with no pair on the board, nobody can have a full house. The nuts is three
        kings, from a player holding two kings.
      </p>
      <h2>Starting hands</h2>
      <p>
        There are 1,326 different 2-card starting hands. You'll hear names like <T>pocket pair</T> (two cards of the same
        rank, such as <C c="7c" /> <C c="7h" />), <T>suited</T> (both cards in the same suit), and "AK" (ace-king). A
        pocket pair comes about once every 17 hands.
      </p>
    </>
  );
}

export function Lesson3() {
  return (
    <>
      <p>From strongest to weakest:</p>
      <RankLadder />
      <h2>Three rules that surprise beginners</h2>
      <ol>
        <li>
          <b>The ace can be low in a straight:</b> A-2-3-4-5 is a straight (the lowest one). But a straight can't wrap
          around, so Q-K-A-2-3 is not a straight.
        </li>
        <li>
          <b>Suits never break ties.</b> No suit beats another. <C c="Ah" /> <C c="Kh" /> and <C c="As" /> <C c="Ks" />{" "}
          with the same board tie.
        </li>
        <li>
          <b>A flush beats a straight.</b> Flushes are harder to make.
        </li>
      </ol>
      <p>When two hands are the same type, the higher cards win. Lesson 7 covers how ties are broken.</p>
    </>
  );
}

export function Lesson4() {
  return (
    <>
      <p>
        <T>The button</T> is a marker showing which player is the "dealer" for this hand. It moves one seat to the left
        (clockwise) after every hand, so everyone takes turns.
      </p>
      <h2>The blinds</h2>
      <p>The blinds are the forced bets that start each pot:</p>
      <ul>
        <li>
          The <T>small blind (SB)</T> sits just left of the button and puts in 1 chip.
        </li>
        <li>
          The <T>big blind (BB)</T> sits next to the small blind and puts in 2 chips.
        </li>
      </ul>
      <p>They're called "blinds" because they're paid before seeing any cards.</p>
      <p>
        <b>Posting the blinds isn't a turn.</b> The small blind and big blind put in their chips automatically before the
        cards are dealt. Then the real choices begin.
      </p>
      <h2>Order of play</h2>
      <p>It always goes to the left (clockwise). Try the buttons to compare:</p>
      <SeatMap />
      <ul>
        <li>
          <b>Preflop:</b> the first player to act sits just left of the big blind. The action goes around the table, and the
          blinds choose <b>last</b>: the small blind, then the big blind. With 6 players, the order is: the seat left of the
          big blind, the next two seats, the button, the small blind, and the big blind. The blinds act last because their
          chips already count as bets.
        </li>
        <li>
          <b>Flop, turn, and river:</b> the first player still in the hand left of the button acts first.{" "}
          <b>The button acts last.</b>
        </li>
      </ul>
      <p>
        <b>With only two players ("heads-up")</b> the order flips before the flop. The button posts the small blind and acts
        first preflop. The other player posts the big blind. From the flop on, the big blind acts first and the button acts
        last, as usual. You'll play heads-up first, so this matters right away.
      </p>
      <h2>Why acting last is an advantage</h2>
      <p>
        The player who acts last sees what everyone else did before deciding. If the others check, you might take the pot
        with a bet. If someone bets big, you can fold cheaply. Your place in the order is called your <T>position</T>.
        Acting last is "being in position."
      </p>
      <p>
        <b>The big blind's option.</b> If everyone just calls the big blind before the flop, the big blind can still check
        (end the round) or raise. This is called the big blind's <T>option</T>.
      </p>
    </>
  );
}

export function Lesson5() {
  return (
    <>
      <p>When it's your turn, you choose one move:</p>
      <div className="table-wrap">
        <table className="moves">
          <thead>
            <tr>
              <th scope="col">Move</th>
              <th scope="col">When you can</th>
              <th scope="col">What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Fold</th>
              <td>Always</td>
              <td>Give up the hand. Chips you already put in stay in the pot.</td>
            </tr>
            <tr>
              <th scope="row">Check</th>
              <td>
                Only when there's <b>nothing to call</b>
              </td>
              <td>Pass without putting in chips.</td>
            </tr>
            <tr>
              <th scope="row">Call</th>
              <td>When someone bet more than you have in</td>
              <td>Put in just enough to match the bet.</td>
            </tr>
            <tr>
              <th scope="row">Bet</th>
              <td>When nobody has bet this round</td>
              <td>Put in chips that others must match.</td>
            </tr>
            <tr>
              <th scope="row">Raise</th>
              <td>When someone has bet</td>
              <td>Put in more than the bet, so others must match the new amount.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <b>Facing a bet, you have three choices: fold, call, or raise.</b> Checking isn't one of them. You can't stay in the
        hand for free once someone has put in more than you.
      </p>
      <p>
        <b>A bet and a raise are the same idea.</b> A bet is the first chips anyone puts in during a betting round. A raise
        makes an existing bet bigger. After either one, <b>every other player still in the hand gets a turn</b> to fold,
        call, or raise again, including a player who bet earlier and now faces a raise. Nobody has to match it. They can
        always fold. The round ends when everyone still in has put in the same amount.
      </p>
      <h2>Why bet or raise at all?</h2>
      <p>There are two main reasons:</p>
      <ul>
        <li>
          <b>For value:</b> you think your hand is probably best, and you want worse hands to put more chips in the pot.
        </li>
        <li>
          <b>As a bluff:</b> your hand is probably worse, and you want better hands to fold.
        </li>
      </ul>
      <p>
        With a medium hand, checking or calling is often better. A bet would mostly get called by better hands and fold out
        worse ones. Lessons after you start playing go deeper into this, including why bluffing has to be part of good play.
      </p>
      <p>
        <b>"Nothing to call" isn't the same as "nobody bet."</b> The big blind already has 2 in. If everyone just calls 2,
        the big blind has nothing more to put in, so they may check.
      </p>
      <h2>"Raise to" vs. "raise by"</h2>
      <p>
        This app always uses <b>"raise to"</b>: the total you'll have in for this betting round. The big blind is 2. You{" "}
        <b>raise to 6</b>. That's 4 more than the big blind, so you <b>raised by 4</b>.
      </p>
      <RaiseToBy />
      <h2>The minimum bet and raise</h2>
      <ul>
        <li>The smallest <b>bet</b> is the big blind (2).</li>
        <li>
          A <b>raise</b> must be at least as big as the last bet or raise in this round. If A raises to 6 (by 4), the next
          player must raise to at least 10 (6 + 4).
        </li>
        <li>
          There's no maximum in No-Limit Hold'em. You can bet everything you have, which is called going <T>all-in</T>{" "}
          (Lesson 6).
        </li>
      </ul>
    </>
  );
}

export function Lesson6() {
  return (
    <>
      <p>
        <T>All-in</T> means putting in all your chips. You can always go all-in for whatever you have, even if it's less
        than a full call or less than a minimum raise.
      </p>
      <h2>When you can't afford a call</h2>
      <p>
        Your opponent bets 100, and you have only 30. You may still call for 30, all-in. You can only win as much from your
        opponent as you put in yourself, so <b>the 70 nobody matched goes back to your opponent</b>.
      </p>
      <AllInRefund />
      <p>
        <b>When your opponent is all-in:</b> you can only call or fold. Raising makes no sense, because nobody is left to
        match it.
      </p>
      <p>
        <b>After an all-in is called,</b> no more betting can happen. The remaining shared cards are simply dealt out ("run
        out"), and then the showdown decides.
      </p>
      <p>
        <b>An all-in can be smaller than a minimum raise.</b> If the minimum raise is to 10 and you have only 8, you may
        still go all-in for 8.
      </p>
      <p>
        <b>More than two players?</b> Then a short all-in creates <T>side pots</T>, extra pots that only some players can
        win. You'll learn those when you play at a bigger table. Heads-up never needs them.
      </p>
    </>
  );
}

export function Lesson7() {
  return (
    <>
      <p>At the showdown, the remaining players show their cards, and the best five-card hand wins.</p>
      <h2>Kickers break ties between equal hands</h2>
      <p>
        A <T>kicker</T> is a card that doesn't make up the pair or other combination but still counts toward the 5. Board:{" "}
        <C c="Ad" /> <C c="8c" /> <C c="4s" /> <C c="9h" /> <C c="2c" />. You hold <C c="As" /> <C c="Kd" />; your
        opponent holds <C c="Ac" /> <C c="Qh" />.
      </p>
      <KickerCompare />
      <p>
        Both have a pair of aces. Compare the next-highest cards: your K beats their Q. <b>You win.</b> Kickers are compared
        one at a time, highest first, until one is different.
      </p>
      <p>
        <b>Sometimes the kicker is on the board.</b> Board: <C c="As" /> <C c="Kc" /> <C c="Ks" /> <C c="Qd" />{" "}
        <C c="Jh" />. You hold <C c="Ac" /> <C c="3d" />; your opponent holds <C c="Ad" /> <C c="4h" />. Both best hands
        are A-A-K-K-Q. Your 3 and their 4 don't play, so you <b>split the pot</b>.
      </p>
      <h2>Split pots</h2>
      <p>
        When hands are exactly equal, the pot is shared equally. If it can't be split evenly, the leftover chip goes to the
        tied player sitting first to the left of the button.
      </p>
      <h2>Showing and mucking</h2>
      <p>
        In a real game, a player who loses at showdown may <T>muck</T>: throw their cards away face down without showing
        them. In this app, all hands at the showdown are shown, so you can learn from them.
      </p>
    </>
  );
}
