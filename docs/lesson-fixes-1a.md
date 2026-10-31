# Lesson accuracy fixes (step 1a) — for the owner's review

Places where the current lesson text is slightly wrong or too loose, found with Codex (thread `01a19200-e08d-7f61-a533-e99bcd483ab0`) and checked by Claude. Each shows the current text, the proposed text, and why. No quiz answer changes; some quiz questions only state their assumptions more clearly. Simplification and new visuals come in step 1b.

## Lesson 1: when a betting round ends

- **Now:** "A betting round ends when everyone still in has put in the same amount, or is all-in. Then the next card comes."
- **Proposed:** "A betting round ends when everyone still in has had a turn and has either matched the biggest bet or is all-in. (Before the flop, the big blind still gets a turn even if everyone just matched the blind.) Then the next shared cards come, or after the river, the showdown."
- **Why:** Equal amounts alone don't end the round: the big blind gets a turn even when everyone only matched the blind. And after the river no card comes.

## Lesson 2: number of starting hands

- **Now:** "There are 1,326 different 2-card starting hands."
- **Proposed:** "There are 1,326 different pairs of cards you can be dealt."
- **Why:** "Starting hands" usually means types like "AK" or "pocket sevens" (there are 169). 1,326 counts the exact cards.

## Lesson 5: your moves

1. **Now:** "**Facing a bet, you have three choices: fold, call, or raise.** Checking isn't one of them. You can't stay in the hand for free once someone has put in more than you."
   **Proposed:** "**Facing a bet, you can fold or call, and usually raise.** Checking isn't one of them: you can't stay in the hand for free once someone has put in more than you. (Raising isn't always allowed; Lesson 6 explains when an all-in limits it.)"
   **Why:** After a short all-in, a player may be allowed only to call or fold.
2. **Now:** "A **raise** must be at least as big as the last bet or raise in this round."
   **Proposed:** "A **raise** must add at least as much as the last full bet or raise in this round." (The example after it stays.) Add: "An all-in that adds less than that doesn't lower the minimum (Lesson 6)."
   **Why:** A short all-in doesn't change the minimum raise.
3. **Now:** "There's no maximum in No-Limit Hold'em. You can bet everything you have…"
   **Proposed:** "No-Limit Hold'em has no maximum bet except your stack: you can bet everything you have…"
   **Why:** You can't bet more than you have.
4. **Quiz L5-Q3:** "On the flop, your opponent bets 20. Which moves can you make?" → "On the flop, your opponent bets 20, and you have plenty of chips. Which moves can you make?" (Answer unchanged: fold, call 20, or raise to at least 40.)

## Lesson 6: all-in

1. **Now:** "**Heads-up, when your opponent is all-in:** you can only call or fold. Raising makes no sense, because nobody is left to match it."
   **Proposed:** "**Heads-up, when your opponent is all-in and you still owe chips:** you can only call or fold. You can't raise, because nobody is left to match it."
   **Why:** If you already matched their all-in, there's nothing to decide. And the app doesn't allow that raise at all, so "can't" is accurate.
2. **Now:** "Their extra chips go into a **side pot** that the all-in player can't win."
   **Proposed:** "Their extra chips that get matched go into a **side pot** that the all-in player can't win. Chips nobody matches go back to their owner."
3. **Quiz L6-Q1:** "You have 30 chips. Your opponent bets 100." → "Heads-up, you have 30 chips and your opponent bets 100." (Answer unchanged.)
   **Why:** The "extra 70 goes back" explanation is true heads-up; at a bigger table another player could still call it.

## Lesson 7: kickers and split pots

1. **Now:** "**Kickers break ties between equal hands.**"
   **Proposed:** "**Kickers decide between hands of the same kind.**" (The definition after it stays.)
   **Why:** Two pairs of aces are the same *kind* of hand, and a kicker can separate them. Truly equal five-card hands can't be separated: they split the pot.
2. **Now:** "If it can't be split evenly, the leftover chip goes to the tied player sitting first to the left of the button."
   **Proposed:** "If it can't be split evenly, the leftover chips go one at a time to the tied players, starting with the first one to the left of the button."
   **Why:** With three or more tied players, there can be more than one leftover chip. (Same fix in Lesson 16.)

## Lesson 9: pot odds

1. **Now:** "With two cards to come and no more betting (for example, someone is all-in on the flop), multiply by 4."
   **Proposed:** "With two cards to come, multiply by 4, but only if you'll see both cards with no more betting (for example, heads-up when one player is all-in on the flop)."
   **Why:** At a bigger table, one player being all-in doesn't stop the others from betting.
2. **Quiz L9-Q1:** "The pot is 60 (including the bet), and you must call 20." → add "and your call ends the betting". (Answer unchanged: 25%.)

## Lesson 10: the gambler's fallacy

1. **Now:** "As you deal more, the bars settle closer to 2.56% and the margin-of-error lines get shorter."
   **Proposed:** "As you deal more, the margin-of-error lines get shorter and the bars tend to settle near 2.56%, though a new batch can still move them a little away."
   **Why:** More hands make the estimate tighter on the whole, but not closer with every single batch.
2. **Quiz L10-Q2:** "The simulation shows premium hands at 3.1% after losing streaks, compared with 2.56% overall." → "After losing streaks, the simulation found 31 premium hands in 1,000 (3.1%), with a margin of error of about 2.2% to 4.4%. Overall the chance is 2.56%." Answer unchanged ("Probably random wobble; check the margin of error").
   **Why now:** "A small sample always differs a little from the true chance. With more hands, it gets closer to 2.56%."
   **Why proposed:** "2.56% is inside the margin of error, so 3.1% fits ordinary random wobble. The chance itself never changed."
   **Why:** A sample doesn't *always* differ, and 3.1% alone can't be judged without knowing how many hands it came from.

## Lesson 11: bluffing

- **Quiz L11-Q3:** "Your opponent never folds. Should you bluff?" → "In this lesson's game, your opponent never folds. Should you bluff?" Explanation: "In this game, 'nothing' always loses when called, so against someone who never folds every bluff loses 50. Bet your good hands instead: they get paid."
- **Why:** In real poker a bluff can sometimes improve and win when called; the claim is exact only in the lesson's game.

## Lesson 13: why aces lose

- **Now:** "**The kings make a straight or a flush.** … This decides about 2.6 boards in 100."
- **Proposed:** "**No king comes, but the kings make a straight or a flush.** … This decides about 2.6 boards in 100."
- **Why:** The numbers are right (counted over all 1,712,304 boards: the kings win 18.55%; 15.98% with a king on the board, 2.57% without). The new wording makes clear the two cases don't overlap.

## Lesson 14: Kelly

1. **Now:** "The order doesn't matter, because multiplying gives the same answer in any order."
   **Proposed:** "The order doesn't change the final balance, because multiplying gives the same answer in any order. (The ups and downs along the way do differ.)"
2. **Quiz L14-Q2** answer B: "You don't grow; over a long run you slowly lose" → "In a typical run you don't grow; over a long run you slowly lose." Add to the explanation: "Your *average* result can still look good on paper, because a few very lucky runs win big; a typical run shrinks."
   **Why:** At twice Kelly, a typical run shrinks slightly (×0.99986 per bet), but the average over all possible runs grows (×1.02 per bet). Kelly is about the typical run, so the answer needs that word.

## Lesson 15: position

1. **Now:** "After the flop, the order counts only players still in the hand. If the small blind folded, the big blind acts first."
   **Proposed:** "After the flop, skip players who folded or are all-in: the first player left of the button who can still bet acts first. If the small blind folded, the big blind acts first."
   **Why:** An all-in player is still in the hand but doesn't act.
2. **Now:** "On the button, you've seen what everyone else did before you choose, and you act last on every round after the flop."
   **Proposed:** "On the button, you act last on every round after the flop, so you see what everyone else did before you choose."
   **Why:** Before the flop the blinds act after the button, so "you've seen what everyone did" is true only after the flop.

## Lesson 16: side pots

1. **Now:** "With three or more players, the chips beyond that go into a **side pot** that the all-in player can't win."
   **Proposed:** "With three or more players, further chips that at least two other players match go into a **side pot** that the all-in player can't win. Chips nobody matches go back to their owner."
   **Why:** Unmatched chips are returned, not put in a side pot (the lesson's own example returns C's last 20).
2. Odd chips: the same fix as Lesson 7.
