// Lessons 1–7. The text matches docs/lessons.md, which the owner reviewed.
import type { ReactNode } from "react";
import { C } from "../cards";
import { AllInRefund, BestFiveRows, KickerCompare, RaiseToBy, RankLadder, SeatMap, StreetTimeline } from "../diagrams";
import { SituationCards } from "../visuals";

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
        explains each move). A betting round ends when everyone still in has matched the biggest bet or is all-in, and everyone who can still act has had a turn. Then the hand moves on.
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
        There are 1,326 possible two-card combinations. You'll hear names like <T>pocket pair</T> (two cards of the same
        rank, such as <C c="7c" /> <C c="7h" />), <T>suited</T> (both cards in the same suit), and "AK" (ace-king). A
        pocket pair comes about once every 17 hands.
      </p>
    </>
  );
}

export function Lesson3() {
  return (
    <>
      <p>From strongest to weakest, with how often each comes up:</p>
      <RankLadder />
      <p>
        <b>How often</b> is the chance that your 7 cards (your 2 plus all 5 on the board) make that hand as their best, if
        you see the river. These numbers were counted exactly over all 133,784,560 possible 7-card combinations. They're
        not your chance of <i>winning</i>: your opponents get 7 cards too.
      </p>
      <p>
        <b>Notice:</b> with 7 cards, one pair (43.8%) and two pair (23.5%) are more common than no pair at all (17.4%).
        That's why a single pair is often not enough to win. Hand rankings come from how rare each hand is in 5-card poker.
        With 7 cards the order stays the same, with one exception: no pair at all becomes rarer than one pair or two pair.
      </p>
      <h2>Three rules that surprise beginners</h2>
      <ol>
        <li>
          <b>The ace can be low in a straight:</b> A-2-3-4-5 is a straight (the lowest one). But a straight can't wrap
          around, so Q-K-A-2-3 is not a straight.
        </li>
        <li>
          <b>Suits never break ties.</b> No suit beats another. On <C c="Qd" /> <C c="Jc" /> <C c="Th" /> <C c="2s" />{" "}
          <C c="3c" />, <C c="Ah" /> <C c="Kh" /> and <C c="As" /> <C c="Ks" /> both make the same straight and tie. (A suit
          only matters when five cards of it make a flush. On a board with three hearts, <C c="Ah" /> <C c="Kh" /> would
          make a flush and win.)
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
      <p>
        On your turn, first ask: <b>do you owe chips?</b>
      </p>
      <SituationCards />
      <p>
        <b>If you owe chips, you can't check.</b> You can fold, call, or raise if allowed. You can always <T>fold</T>: you
        give up the hand, and chips you already put in stay in the pot. Folding when you could check for free just throws
        the hand away.
      </p>
      <p>
        <b>A raise is a bigger bet.</b> After a bet or raise, every other player who can still act gets a turn, including a
        player who bet earlier. Nobody has to call. The round ends as Lesson 1 describes.
      </p>
      <h2>Why bet or raise?</h2>
      <ul>
        <li>
          <b>For value:</b> your hand is probably best, and you want worse hands to put in more.
        </li>
        <li>
          <b>As a bluff:</b> your hand is probably worse, and you want better hands to fold.
        </li>
      </ul>
      <p>With a medium hand, checking or calling is often better: betting may make weaker hands fold while stronger hands call.</p>
      <h2>"Raise to" vs. "raise by"</h2>
      <p>
        This app always says <b>"raise to"</b>: your total for this round. The big blind is 2. You <b>raise to 6</b>: that's
        4 more, so you <b>raised by 4</b>.
      </p>
      <RaiseToBy />
      <h2>Smallest and largest bets</h2>
      <ul>
        <li>The smallest <b>bet</b> is the big blind (2).</li>
        <li>
          A full <b>raise</b> must add at least as much as the last full bet or raise this round. After a raise to 6 (by 4),
          the next full raise is to at least 10.
        </li>
        <li>
          In No-Limit Hold'em, the only maximum is your stack. Betting everything is going <T>all-in</T> (Lesson 6).
        </li>
      </ul>
    </>
  );
}

export function Lesson6() {
  return (
    <>
      <p>
        <T>All-in</T> means putting in all your chips. You can always call all-in, even with fewer chips than the bet.
        And whenever you're allowed to raise, you may go all-in even if that's less than a minimum raise.
      </p>
      <h2>When you can't afford a call</h2>
      <p>
        Heads-up, your opponent bets 100, and you have only 30. You may still call for 30, all-in. You can only win as much from your
        opponent as you put in yourself, so <b>the 70 nobody matched goes back to your opponent</b>.
      </p>
      <AllInRefund />
      <p>
        <b>Heads-up, when your opponent is all-in and you owe chips:</b> you can only call or fold. Nobody is left to match a raise.
      </p>
      <p>
        <b>Heads-up, after an all-in is called,</b> no more betting can happen. The remaining shared cards are simply dealt
        out ("run out"), and then the showdown decides.
      </p>
      <p>
        <b>An all-in can be smaller than a minimum raise.</b> If the minimum raise is to 10 and you have only 8, you may
        still go all-in for 8.
      </p>
      <p>
        <b>More than two players?</b> Two things change, and you'll practice both at a bigger table later:
      </p>
      <ul>
        <li>
          The players who still have chips can keep betting against each other. Their matched extra chips go into a{" "} <T>side pot</T> the all-in player can't win; unmatched chips go back.
        </li>
        <li>
          <b>A short all-in may not reopen the betting.</b> A player who already bet or raised can raise again only if the
          amount has gone up by at least a full raise since then. For example: A bets 10, B goes all-in for 16 (only 6
          more), and C calls. A may call the 6 or fold, but may not raise. If A had only checked, A could raise. And if
          several short all-ins add up to a full raise, A may raise again.
        </li>
      </ul>
      <p>Heads-up never needs side pots.</p>
    </>
  );
}

export function Lesson7() {
  return (
    <>
      <p>At the showdown, the remaining players show their cards, and the best five-card hand wins.</p>
      <h2>Kickers can decide otherwise matching hands</h2>
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
        When hands are exactly equal, the pot is shared equally. Any leftover chips go one at a time to the tied players, starting left of the button.
      </p>
      <h2>Showing and mucking</h2>
      <p>
        In a real game, a player who loses at showdown may <T>muck</T>: throw their cards away face down without showing
        them. In this app, all hands at the showdown are shown, so you can learn from them.
      </p>
    </>
  );
}
