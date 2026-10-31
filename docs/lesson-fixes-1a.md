# Lesson accuracy fixes (step 1a) — for the owner's review

Places where the current lesson text is slightly wrong or too loose, found with Codex (thread `01a19200-e08d-7f61-a533-e99bcd483ab0`) and checked by Claude. Each **replaces** the current text. Rewrites are kept about as long as the original or shorter; only a few quiz questions gain a short assumption. No quiz answer changes. Simplification and new visuals come in step 1b.

## Lesson 1: when a betting round ends

- **Now:** "A betting round ends when everyone still in has put in the same amount, or is all-in. Then the next card comes."
- **Proposed:** "A betting round ends when everyone still in has had a turn and matched the biggest bet, or is all-in. Then the hand moves on."
- **Why:** Equal amounts alone don't end the round: before the flop, the big blind still gets a turn after everyone just matches the blind. And after the river, no card comes.

## Lesson 2: number of starting hands

- **Now:** "There are 1,326 different 2-card starting hands."
- **Proposed:** "You can be dealt 1,326 different pairs of cards."
- **Why:** "Starting hands" usually means types like "AK" or "pocket sevens" (169 of them). 1,326 counts the exact cards.

## Lesson 5: your moves

1. **Now:** "Facing a bet, you have three choices: fold, call, or raise. Checking isn't one of them. You can't stay in the hand for free once someone has put in more than you."
   **Proposed:** "Facing a bet, you can fold, call, or (usually) raise. You can't check: staying in costs at least a call."
   **Why:** After a short all-in, a player may only be allowed to call or fold (Lesson 6).
2. **Now:** "A raise must be at least as big as the last bet or raise in this round."
   **Proposed:** "A raise must add at least as much as the last full bet or raise this round."
   **Why:** A short all-in doesn't change the minimum raise.
3. **Now:** "There's no maximum in No-Limit Hold'em. You can bet everything you have"
   **Proposed:** "In No-Limit Hold'em, the only maximum is your stack: you can bet everything you have"
4. **Quiz L5-Q3:** "On the flop, your opponent bets 20." → "On the flop, your opponent bets 20 and you have plenty of chips." (Answer unchanged.)

## Lesson 6: all-in

1. **Now:** "Heads-up, when your opponent is all-in: you can only call or fold. Raising makes no sense, because nobody is left to match it."
   **Proposed:** "Heads-up, when your opponent is all-in and you owe chips: you can only call or fold. Nobody is left to match a raise."
   **Why:** If you already matched their all-in, there's nothing to decide.
2. **Now:** "Their extra chips go into a side pot that the all-in player can't win."
   **Proposed:** "Their matched extra chips go into a side pot the all-in player can't win; unmatched chips go back."
3. **Quiz L6-Q1:** "You have 30 chips." → "Heads-up, you have 30 chips." (Answer unchanged.)
   **Why:** "The extra 70 goes back" is true heads-up; at a bigger table someone else could still call it.

## Lesson 7: kickers and split pots

1. **Now:** "Kickers break ties between equal hands."
   **Proposed:** "Kickers decide between hands of the same kind."
   **Why:** Two pairs of aces are the same kind of hand, and a kicker can separate them. Truly equal five-card hands split the pot.
2. **Now:** "If it can't be split evenly, the leftover chip goes to the tied player sitting first to the left of the button."
   **Proposed:** "Any leftover chips go one at a time to the tied players, starting left of the button."
   **Why:** With three or more tied players there can be more than one leftover chip. (Same fix in Lesson 16.)

## Lesson 9: pot odds

1. **Now:** "With two cards to come and no more betting (for example, someone is all-in on the flop), multiply by 4."
   **Proposed:** "With two cards to come and no more betting (for example, heads-up after an all-in on the flop), multiply by 4."
   **Why:** At a bigger table, one player being all-in doesn't stop the others betting.
2. **Quiz L9-Q1:** "you must call 20" → "you must call 20, and your call ends the betting". (Answer unchanged.)

## Lesson 10: the gambler's fallacy

1. **Now:** "As you deal more, the bars settle closer to 2.56% and the margin-of-error lines get shorter."
   **Proposed:** "As you deal more, the margin-of-error lines get shorter, and the bars usually end up near 2.56%."
   **Why:** More hands tighten the estimate overall, but not with every single batch.
2. **Quiz L10-Q2:** "The simulation shows premium hands at 3.1% after losing streaks, compared with 2.56% overall." → "After losing streaks, the simulation shows 31 premium hands in 1,000 (3.1%; margin of error about 2.2% to 4.4%), versus 2.56% overall." (Answer unchanged.)
   **Why now:** "A small sample always differs a little from the true chance. With more hands, it gets closer to 2.56%."
   **Why proposed:** "2.56% is inside the margin of error, so 3.1% is ordinary wobble. The chance didn't change."
   **Why:** 3.1% can't be judged without knowing how many hands it came from, and a sample doesn't *always* differ.

## Lesson 11: bluffing

- **Quiz L11-Q3:** "Your opponent never folds." → "In this lesson's game, your opponent never folds." Why: "A bluff only wins when the opponent folds. Against someone who always calls, every bluff loses." → "In this game a bluff always loses when called, so against someone who never folds, every bluff loses 50."
- **Why:** In real poker a bluff can sometimes improve and win when called; the claim is exact only in the lesson's game.

## Lesson 13: why aces lose

- **Now:** "The kings make a straight or a flush."
- **Proposed:** "No king comes, but the kings make a straight or a flush."
- **Why:** The numbers are right (counted over all 1,712,304 boards: the kings win 18.55%, 15.98% with a king on the board and 2.57% without). The wording now shows the two cases don't overlap.

## Lesson 14: Kelly

1. **Now:** "The order doesn't matter, because multiplying gives the same answer in any order."
   **Proposed:** "The order doesn't change the final balance: multiplying gives the same answer in any order."
2. **Quiz L14-Q2** answer: "You don't grow; over a long run you slowly lose" → "A typical run doesn't grow; over a long run it slowly shrinks." Add to the explanation: "A few lucky runs pull the average up, but a typical run shrinks."
   **Why:** At twice Kelly, a typical run shrinks slightly (×0.99986 per bet), but the average over all possible runs grows (×1.02 per bet). Kelly is about the typical run.

## Lesson 15: position

1. **Now:** "After the flop, the order counts only players still in the hand. If the small blind folded, the big blind acts first."
   **Proposed:** "After the flop, skip anyone who folded or is all-in. If the small blind folded, the big blind acts first."
   **Why:** An all-in player is still in the hand but doesn't act.
2. **Now:** "On the button, you've seen what everyone else did before you choose, and you act last on every round after the flop."
   **Proposed:** "On the button, you act last after the flop, so you see everyone else's choices first."
   **Why:** Before the flop the blinds act after the button.

## Lesson 16: side pots

1. **Now:** "With three or more players, the chips beyond that go into a side pot that the all-in player can't win."
   **Proposed:** "With three or more players, the others' matched extra chips form a side pot the all-in player can't win. Unmatched chips go back."
   **Why:** Unmatched chips are returned, not put in a side pot (the lesson's own example returns C's last 20).
2. Odd chips: the same fix as Lesson 7.
