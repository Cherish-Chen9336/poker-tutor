# Rules scenarios

These are plain-English poker scenarios that define what "correct" means for the engine. Each one is an automated test. Rules follow the Poker TDA (Tournament Directors Association) standard for No-Limit Hold'em.

Status: **all scenarios are tested** (`src/engine/scenarios.test.ts`, plus #13 in `src/engine/rules.test.ts`). Claude checked each expected result against the TDA rules on 2026-10-29, and Codex checked the numbers for 5–12. The owner reviews whether each explanation makes sense to a beginner.

Unless a scenario says otherwise:
- The blinds are 1/2: the small blind is 1 chip and the big blind is 2 chips.
- All amounts include the blinds. "Puts in 50" means 50 chips in total over the hand.
- On the first hand, seat 0 has the button. With 3 or more players, the next seat posts the small blind and the one after that posts the big blind.

**Background rule (checked in every test):** chips are never created or destroyed. All stacks, plus all pots, plus any bets still in front of players, always add up to the starting total.

## Turn order and betting

**1. Heads-up turn order**
- **Setup:** 2 players.
- **Expected:** The dealer (button) posts the small blind and acts first before the flop. From the flop on, the big blind acts first.
- **Lesson:** With only 2 players, the usual order flips before the flop.

**1b. Turn order with 3 or more players**
- **Setup:** 4 players. Before the flop, everyone just calls the big blind.
- **Expected:** Before the flop, the first player to act sits left of the big blind. The big blind acts last and may still check or raise, even though nobody raised (this is called the big blind's **option**). From the flop on, the first player still in the hand left of the button acts first.
- **Lesson:** The button acts last on every street after the flop, which is why it's the best seat.

**2. Uncalled bets come back**
- **Setup:** 2 players. Both put in 2 before the flop, so the pot is 4. On the flop, B bets 50 and A folds.
- **Expected:** B gets the 50 back and wins the pot of 4.
- **Lesson:** A bet that nobody matches goes back to the player who made it. (Chips from players who folded still belong to the pot.)

**3. Minimum bet and raise**
- **Setup:** 3 players. Before the flop, A raises to 6, which is 4 more than the big blind.
- **Expected:** B's smallest legal re-raise is to 10 (6 + 4). A raise to 9 is rejected. Nobody may check when facing a bet. After the flop, the smallest opening bet is the big blind (2).
- **Lesson:** A raise must be at least as big as the previous raise.

**3b. An all-in may be smaller than the minimum**
- **Setup:** As in #3, but B has only 8 chips in total. A raises to 6.
- **Expected:** B may go all-in to 8, even though that raises by only 2.
- **Lesson:** Whenever you're allowed to bet or raise, you may go all-in even if that's less than the minimum. (If the betting hasn't been reopened to you, as in #5, you can only call or fold.)

**4. A short all-in keeps the full raise size**
- **Setup:** On the flop, A bets 100. B goes all-in for 150, which is only 50 more. C hasn't acted yet.
- **Expected:** C's smallest legal raise is to 250 (150 + 100), not 200.
- **Lesson:** An all-in smaller than a full raise doesn't shrink the minimum raise. (This is the bug that ruled out `poker-ts`.)

**5. A short all-in doesn't reopen the betting**
- **Setup:** On the flop, A bets 100 and B calls. C goes all-in for 120, which is only 20 more.
- **Expected:** A and B may only call the extra 20 or fold. Neither may raise.
- **Lesson:** Players who already acted can raise again only when facing a full raise.

**5b. Several short all-ins can add up to a full raise**
- **Setup:** 5 players. On the flop, A bets 100. B goes all-in for 150 (50 more), and C calls 150. D goes all-in for 200 (another 50 more), and E calls 200.
- **Expected:** A now faces 100 more than A's own bet, which is a full raise, so A may raise again (to at least 300). If A only calls, C faces just 50 more than C's own call, so C may only call or fold.
- **Lesson:** What counts is how much more you face since your own last action, so the same bets can reopen the betting for one player but not another.

## Pots

**6. Main pot and side pot**
- **Setup:** 3 players. A starts with 50 and goes all-in before the flop; B and C call. On the flop, B bets 100 and C calls. So A put in 50, and B and C each put in 150. A has the best hand, B the second best.
- **Expected:** The main pot is 150 (50 from each player), and all three can win it. The side pot is 200 (the extra 100 each from B and C), and only B and C can win it. A wins 150, and B wins 200.
- **Lesson:** You can only win from each opponent as much as you put in yourself.

**7. Folded chips stay in the pot**
- **Setup:** A goes all-in for 50 before the flop. B and C each put in 100 by the end of the flop. On the turn, B bets 50 and C folds. A has the best hand.
- **Expected:** B's 50 is uncalled and comes back to B. The main pot is 150 and goes to the better hand between A and B (A). The side pot is 100 (50 each from B and C) and goes to B, the only player left who can win it.
- **Lesson:** Folding gives up your claim to the pot, but not the chips you already put in.

## Showdown

**8. The kicker decides**
- **Setup:** The board is A♦ 8♣ 4♠ 9♥ 2♣. Player A holds A♠ K♦, and player B holds A♣ Q♥.
- **Expected:** Both have a pair of aces. A wins because their king outranks B's queen.
- **Lesson:** A **kicker** is an unpaired card that breaks ties between equal hands. Kickers are compared one at a time, highest first, until one is different.

**9. Only the best five cards count**
- **Setup:** The board is A♦ A♣ K♠ K♥ Q♣. Player A holds J♠ J♦, and player B holds 3♣ 2♦.
- **Expected:** It's a tie. Both best hands are A-A-K-K-Q, so A's pair of jacks doesn't play.
- **Lesson:** Your hand is the best 5 out of 7 cards, and sometimes your own 2 cards don't matter.

**10. Split pot**
- **Setup:** The board is A♠ K♠ Q♠ J♠ 10♠, a royal flush. 3 players each put in 2 before the flop. On the flop, two of them put in 2 more, and the third folds. The pot is 10.
- **Expected:** The two players still in the hand split the pot, 5 each. The player who folded gets nothing.
- **Lesson:** When the board itself is the best possible hand, everyone still in the hand shares it.

**11. The odd chip**
- **Setup:** 3 players, royal flush on the board. The button calls 2, the small blind folds its 1, and the big blind checks. The pot is 5.
- **Expected:** The big blind gets 3 and the button gets 2. The extra chip goes to the tied player sitting first to the left of the button.
- **Lesson:** Chips can't be cut in half, so a fixed seat rule decides who gets the leftover.

**12. All-in before the flop**
- **Setup:** Heads-up, both players go all-in before the flop.
- **Expected:** The flop, turn, and river are dealt with no more betting, and then the showdown happens.
- **Lesson:** Once nobody can bet, the remaining cards are simply dealt out.

**13. Tied pot after several players fold (regression for a library bug)**
- **Setup:** 5 players. Over the hand, the players put in 10, 1, 2, 7, and 10. Three of them fold. The two who reach the showdown tie, because the board is a royal flush.
- **Expected:** The 30-chip pot splits 15/15.
- **Lesson:** Chips from folded players join the pot, and the pot is split once.
- **Note:** Without our patch, the library pays 14/16.

## Blinds and the button

**14. A big blind that can't pay the full blind**
- **Setup:** 3 players. The big blind has only 1 chip.
- **Expected:** The big blind posts 1 and is all-in. The others must still call the full 2. The main pot is 3 (1 from each player). The second chip from each caller forms a side pot of 2 that only they can win.
- **Lesson:** Posting a blind can put you all-in, but it doesn't make the game cheaper for everyone else.

**15. The button moves after a player runs out of chips**
- **Setup:** 3 players. The big blind has only 2 chips, goes all-in by posting, and loses.
- **Expected:** In the next hand, only 2 players are left. The button moves to the next seat, and that player posts the small blind and acts first.
- **Lesson:** Heads-up rules start as soon as only two players remain. The button is placed so that nobody has to post the big blind twice in a row, so it doesn't always simply move one seat.

**16. A rejected action changes nothing**
- **Setup:** A player tries to raise less than the minimum, or to act when it isn't their turn.
- **Expected:** The action is refused and the game is exactly as it was.
- **Lesson:** An illegal move doesn't count, so the player gets to choose again.

**20. Nobody left to bet against**
- **Setup:** 4 players. Two of them go all-in before the flop. On the turn, one of the other two folds, leaving only one player who still has chips.
- **Expected:** No more betting happens. The river is dealt and the hand goes to showdown.
- **Lesson:** Betting needs at least two players who can still put in chips. (The library got this wrong; our patch fixes it.)

**21. The blinds can end the betting by themselves**
- **Setup:** Heads-up. One player has so few chips that posting a blind puts them all-in, and the other player's blind already covers it (for example, the small blind has only 1 chip).
- **Expected:** Nobody is asked to act. All five board cards are dealt and the hand goes to showdown. Any blind chips beyond what the all-in player could match go back to their owner.
- **Lesson:** Once a player is all-in and matched, nobody can bet against them, so the cards just get dealt. (The library got this wrong; our patch fixes it.)

## Comparing hands

**17. The lowest straight**
- **Expected:** A-2-3-4-5 is a straight (the ace counts as a 1), and it loses to 2-3-4-5-6. Q-K-A-2-3 is not a straight.
- **Lesson:** The ace can be high or low, but a straight can't wrap around from king to 2.

**18. Flush against flush**
- **Expected:** A-9-7-4-2 of hearts beats K-Q-J-9-7 of hearts. A-K-7-4-3 beats A-K-7-4-2.
- **Lesson:** Compare flushes card by card from the top, like kickers. Suits never break ties.

**19. Full house against full house**
- **Expected:** 4-4-4-2-2 beats 3-3-3-A-A. With the same three of a kind (possible with a shared board), the pair decides: Q-Q-Q-9-9 beats Q-Q-Q-5-5.
- **Lesson:** In a full house, the three matching cards count first.
