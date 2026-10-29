# Rules scenarios

These are plain-English poker scenarios that define what "correct" means for the engine. Each one becomes an automated test. Rules follow the Poker TDA (Tournament Directors Association) standard for No-Limit Hold'em.

Status: **draft.** Claude verifies the expected results against the TDA rules and the engine. Ella reviews whether each explanation makes sense to a beginner. Codex checked the numbers on 2026-10-29: 5–12 are correct, and 7–11 were reproduced with fixed deals.

Clarifications still to make while writing the tests:
- **#3:** a short all-in may be smaller than the minimum bet or raise.
- **#6 and #7:** amounts include the blinds; give the starting stacks and the full action sequence.
- **#8:** kickers are compared one by one, highest first, until one differs.
- **#10:** only players who haven't folded share the pot.
- **#11:** use 3 players. The button calls 2, the small blind folds its 1, and the big blind checks, which makes a pot of 5.

Scenarios still to add:
- several short all-ins that together make a full raise, which does reopen the betting
- turn order with 3 or more players
- the button moving after a player runs out of chips
- a rejected action leaves the game state unchanged
- fixed comparisons: the lowest straight (A-2-3-4-5), flush vs. flush, full house vs. full house
- all-ins caused by posting the blinds

Unless a scenario says otherwise, the blinds are 1/2: the small blind is 1 chip and the big blind is 2 chips.

**Background rule (checked in every test):** chips are never created or destroyed. All stacks plus all pots always add up to the starting total.

## Turn order and betting

**1. Heads-up turn order**
- **Setup:** 2 players.
- **Expected:** The dealer posts the small blind and acts first before the flop. From the flop on, the big blind acts first.
- **Lesson:** With only 2 players, the usual order flips before the flop.

**2. Uncalled bets come back**
- **Setup:** A bets 50 on the flop, and B folds.
- **Expected:** A gets the 50 back and wins only the pot as it stood before that bet.
- **Lesson:** A bet that nobody matches goes back to the player who made it. (Chips from players who folded still belong to the pot.)

**3. Minimum raise**
- **Setup:** Before the flop, A raises to 6, which is 4 more than the big blind.
- **Expected:** B's smallest legal re-raise is to 10 (6 + 4). A raise to 9 is rejected. Separately: nobody may check when facing a bet, and the smallest opening bet is the big blind.
- **Lesson:** A raise must be at least as big as the previous raise.

**4. A short all-in keeps the full raise size**
- **Setup:** On the flop, A bets 100. B goes all-in for 150, which is only 50 more. C hasn't acted yet.
- **Expected:** C's smallest legal raise is to 250 (150 + 100), not 200.
- **Lesson:** An all-in smaller than a full raise doesn't shrink the minimum raise. (This is the bug that ruled out `poker-ts`.)

**5. A short all-in doesn't reopen the betting**
- **Setup:** On the flop, A bets 100 and B calls. C goes all-in for 120, which is only 20 more.
- **Expected:** A and B may only call the extra 20 or fold. Neither may raise.
- **Lesson:** Players who already acted can raise again only when facing a full raise.

## Pots

**6. Main pot and side pot**
- **Setup:** Over the hand, A puts in 50 (all-in), and B and C each put in 150.
- **Expected:** The main pot is 150 (50 from each player), and all three can win it. The side pot is 200 (the extra 100 each from B and C), and only B and C can win it. If A has the best hand, A wins 150 and the better of B and C wins 200.
- **Lesson:** You can only win from each opponent as much as you put in yourself.

**7. Folded chips stay in the pot**
- **Setup:** A goes all-in for 50. B and C each put in 100. On the turn, B bets 50 and C folds.
- **Expected:** B's 50 is uncalled and comes back to B. The main pot is 150 and goes to the better hand between A and B. The side pot is 100 and goes to B.
- **Lesson:** Folding gives up your claim to the pot, but not the chips you already put in.

## Showdown

**8. The kicker decides**
- **Setup:** The board is A♦ 8♣ 4♠ 9♥ 2♣. Player A holds A♠ K♦, and player B holds A♣ Q♥.
- **Expected:** Both have a pair of aces. A wins because their king outranks B's queen.
- **Lesson:** A **kicker** is the highest unpaired card, and it breaks ties between equal pairs.

**9. Only the best five cards count**
- **Setup:** The board is A♦ A♣ K♠ K♥ Q♣. Player A holds J♠ J♦, and player B holds 3♣ 2♦.
- **Expected:** It's a tie. Both best hands are A-A-K-K-Q, so A's pair of jacks doesn't play.
- **Lesson:** Your hand is the best 5 out of 7 cards, and sometimes your own 2 cards don't matter.

**10. Split pot**
- **Setup:** The board is A♠ K♠ Q♠ J♠ 10♠, a royal flush. Two players reach the showdown.
- **Expected:** They split the pot equally.
- **Lesson:** When the board itself is the best possible hand, everyone shares it.

**11. The odd chip**
- **Setup:** Two players tie for a pot of 5.
- **Expected:** One gets 3 and the other gets 2. The extra chip goes to the tied player sitting first to the left of the dealer.
- **Lesson:** Chips can't be cut in half, so a fixed seat rule decides who gets the leftover.

**12. All-in before the flop**
- **Setup:** Heads-up, both players go all-in before the flop.
- **Expected:** The flop, turn, and river are dealt with no more betting, and then the showdown happens.
- **Lesson:** Once nobody can bet, the remaining cards are simply dealt out.

**13. Tied pot after several players fold (regression for a library bug)**
- **Setup:** 5 players with blinds 1/2. Over the hand, the players put in 10, 1, 2, 7, and 10. Three of them fold. The two who reach the showdown tie, because the board is a royal flush.
- **Expected:** The 30-chip pot splits 15/15.
- **Lesson:** Chips from folded players join the pot, and the pot is split once.
- **Status:** ✅ Tested (`src/engine/rules.test.ts`). Without our patch, the library pays 14/16.
