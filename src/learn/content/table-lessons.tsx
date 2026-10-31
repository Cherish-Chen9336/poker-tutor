// Lessons 15–16, for the six-player table. The text matches docs/lessons.md, which the owner reviewed.
import type { ReactNode } from "react";
import { SeatMap, SidePotBars } from "../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

const SEATS: [string, string, string, string][] = [
  ["Left of the button", "Small blind (SB)", "acts 5th", "acts 1st"],
  ["Next", "Big blind (BB)", "acts last (6th)", "acts 2nd"],
  ["Next", "Under the gun (UTG)", "acts first", "acts 3rd"],
  ["Next", "Hijack (HJ)", "acts 2nd", "acts 4th"],
  ["Next", "Cutoff (CO)", "acts 3rd", "acts 5th"],
  ["The dealer", "Button (BTN)", "acts 4th", "acts last"],
];

export function Lesson15() {
  return (
    <>
      <p>With six players, each seat has a name. They're counted from the button:</p>
      <div className="table-wrap">
        <table className="moves">
          <thead>
            <tr>
              <th scope="col">Seat</th>
              <th scope="col">Name</th>
              <th scope="col">Before the flop</th>
              <th scope="col">After the flop</th>
            </tr>
          </thead>
          <tbody>
            {SEATS.map(([seat, name, before, after]) => (
              <tr key={name}>
                <td>{seat}</td>
                <th scope="row">{name}</th>
                <td>{before}</td>
                <td>{after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Pick "6 players" to see the order on the table:</p>
      <SeatMap />
      <ul>
        <li>
          <T>"Under the gun"</T> is the first player to act before the flop. The name comes from feeling the pressure of
          acting first.
        </li>
        <li>
          The <T>cutoff</T> is the seat just before the button, and the <T>hijack</T> is the one before that.
        </li>
        <li>After the flop, the order counts only players still in the hand. If the small blind folded, the big blind acts first.</li>
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
          <b>Acting last is easier.</b> On the button, you've seen what everyone else did before you choose, and you act
          last on every round after the flop. A common guideline is to play more hands from late seats.
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
    </>
  );
}

export function Lesson16() {
  return (
    <>
      <p>
        When a player goes all-in for less than others bet, they can only win as much from each opponent as they put in
        themselves (Lesson 6). With three or more players, the chips beyond that go into a <T>side pot</T> that the all-in
        player can't win.
      </p>
      <h2>An example</h2>
      <p>Three players are all-in before the flop: A has 30 chips, B has 80, and C has 100.</p>
      <SidePotBars />
      <div className="table-wrap">
        <table className="moves">
          <thead>
            <tr>
              <th scope="col">Pot</th>
              <th scope="col">Made of</th>
              <th scope="col">Amount</th>
              <th scope="col">Who can win it</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Main pot</th>
              <td>30 from each player</td>
              <td>90</td>
              <td>A, B, and C</td>
            </tr>
            <tr>
              <th scope="row">Side pot</th>
              <td>50 more each from B and C</td>
              <td>100</td>
              <td>B and C only</td>
            </tr>
            <tr>
              <th scope="row">Returned</th>
              <td>C's last 20, which nobody matched</td>
              <td>20</td>
              <td>goes back to C</td>
            </tr>
          </tbody>
        </table>
      </div>
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
      <p>So the shortest stack can win at most the main pot. Winning the main pot doesn't mean winning the side pot.</p>
      <h2>Things to keep straight</h2>
      <ul>
        <li>
          <b>A side pot isn't a split pot.</b> Side pots are separate pots with different players who can win them. A split
          pot is one pot shared by tied hands.
        </li>
        <li>
          <b>Folded chips stay in.</b> If someone folds after betting, their chips stay in whichever pots they were in, but
          they can't win any of them.
        </li>
        <li>
          <b>Ties are settled pot by pot.</b> Tied hands share each pot they can win. If a pot can't be split evenly, the
          leftover chip goes to the tied player sitting first to the left of the button.
        </li>
        <li>
          <b>One all-in doesn't stop the others.</b> Players who still have chips can keep betting against each other, and
          those bets go into the side pot.
        </li>
      </ul>
    </>
  );
}
