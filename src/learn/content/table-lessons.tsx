// Lessons 15–16, for the six-player table. The text matches docs/lessons.md, which the owner reviewed.
import type { ReactNode } from "react";
import { SeatMap, SidePotBars } from "../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson15() {
  return (
    <>
      <p>
        With six players, each seat has a name, counted clockwise from the button. Switch between "Before the flop" and
        "After the flop" to see when each seat acts:
      </p>
      <SeatMap />
      <ul>
        <li>
          <T>"Under the gun"</T> is the first player to act before the flop. The name comes from feeling the pressure of
          acting first.
        </li>
        <li>
          The <T>cutoff</T> is the seat just before the button, and the <T>hijack</T> is the one before that.
        </li>
        <li>After the flop, start left of the button and skip anyone who folded or is all-in.</li>
        <li>
          The names stay with the seats for the whole hand, even after other players fold. They move one seat to the left
          with the button for the next hand.
        </li>
      </ul>
      <h2>Why position matters even more with six players</h2>
      <ul>
        <li>
          <b>Acting first is harder.</b> From under the gun, five players act after you, and any of them could hold a strong
          hand. A common guideline is to play only your stronger starting hands from early seats.
        </li>
        <li>
          <b>Acting last is easier.</b> On the button, you act last after the flop, so you see everyone else's choices first. A common guideline is to play more hands from late seats.
        </li>
        <li>
          <b>The cards don't change; the information does.</b> Position doesn't make your cards better. It lets you decide
          with more information.
        </li>
      </ul>
      <p>
        <b>More players, stronger hands needed.</b> When several players stay in, it's more likely that someone holds a
        strong hand. A pair that was good heads-up is often behind in a five-way pot.
      </p>
      <p>
        <b>About the practice bots.</b> The bots at this table are simplified practice opponents, not strong players. They
        call more often than careful players do, so you'll often see pots with three or more players. Against players who
        call a lot, a common guideline is to <b>bet your good hands for value</b> (so worse hands pay you) and{" "}
        <b>bluff less</b> (a bluff only works when the other players fold).
      </p>
    </>
  );
}

export function Lesson16() {
  return (
    <>
      <p>
        When a player goes all-in for less than others bet, they can only win as much from each opponent as they put in
        themselves (Lesson 6). With three or more players, the others' matched extra chips form a <T>side pot</T> the
        all-in player can't win. Unmatched chips go back.
      </p>
      <h2>An example</h2>
      <p>
        Three players are all-in before the flop: <b>A</b> with 30 chips, <b>B</b> with 80, and <b>C</b> with 100.
      </p>
      <SidePotBars />
      <p>
        <b>Each pot has its own winner.</b> Suppose A has the best hand, B the second best, and C the worst:
      </p>
      <ul>
        <li>
          <b>A wins the main pot (90).</b> A beat both other players.
        </li>
        <li>
          <b>B wins the side pot (100).</b> A can't win it, so it goes to the better hand between B and C.
        </li>
        <li>
          <b>C gets back 20</b> and loses the other 80.
        </li>
      </ul>
      <p>So the shortest stack can win at most the main pot.</p>
      <h2>Things to keep straight</h2>
      <ul>
        <li>
          <b>A side pot isn't a split pot.</b> A split pot is one pot shared by tied hands.
        </li>
        <li>
          <b>Folded chips stay in</b> the pots they went into, but the player who folded can't win them.
        </li>
        <li>
          <b>Ties are settled pot by pot.</b> Each pot is split equally among its tied winners; any leftover chips go one at
          a time, starting left of the button.
        </li>
        <li>
          <b>One all-in doesn't stop the others.</b> Two or more players with chips can keep betting against each other,
          into a side pot.
        </li>
      </ul>
    </>
  );
}
