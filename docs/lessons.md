# Learn lessons (draft for review)

These are the texts for the Learn area (Step 4). Each lesson takes about 3–5 minutes and ends with quick checks. The owner reviews them as a beginner before any screens are built: mark anything confusing, too long, or too fast.

How to read this file:
- **[Diagram: …]** describes a picture that will be drawn in the app.
- Each quick check has an ID (like `L3-Q2`), the answer, and a short "Why" shown after answering.
- **Checked by** says how the answer is verified: `evaluator` (the hand-ranking library), `table` (the real game engine through the adapter), `math` (an exact calculation in a test), or `review` (a concept question that only a person can check).
- Every card example below was run through the evaluator on 2026-10-30, and the results matched.

Card notation: `A♠` is the ace of spades. Ranks are 2–10, J (jack), Q (queen), K (king), and A (ace). The suits are ♠ spades, ♥ hearts, ♦ diamonds, and ♣ clubs.

Unless a lesson says otherwise, the blinds are 1/2 and each player starts with 200 chips.

---

## Lesson 1: The goal and the flow of a hand

**The goal is to win chips.** Each hand, players put chips into a shared pile in the middle called the **pot**. Whoever wins the hand takes the pot. The chips you have in front of you are your **stack**.

**There are two ways to win a pot:**
1. **Everyone else folds.** To **fold** means to give up the hand. If every other player folds, you win the pot at once. You don't even show your cards. This happens in many hands.
2. **The showdown.** If two or more players are still in after the last betting round, they turn their cards face up. The best five-card hand wins.

So you can win with the best cards, or by making everyone else give up. Most of poker is deciding which hands to keep playing.

**A hand has four betting rounds.** Between them, shared cards are dealt face up in the middle of the table:

| Round | What happens first |
|---|---|
| **Preflop** | Each player gets 2 private cards, face down. |
| **Flop** | 3 shared cards are dealt face up. |
| **Turn** | A 4th shared card. |
| **River** | A 5th and last shared card. |

After each deal there's a betting round. In it, players take turns choosing to bet, match a bet, or fold (Lesson 5 explains each move). A betting round ends when everyone still in has put in the same amount, or is all-in. Then the next card comes.

[Diagram: a timeline of the four rounds, showing the board growing from 0 to 3, 4, then 5 cards, with a "betting" marker after each deal and "showdown" at the end.]

**Before any cards are dealt,** two players must put in forced bets called **blinds**, so there's always something to win. Lesson 4 explains who pays them.

### Quick checks

**L1-Q1.** On the flop, you bet and both other players fold. What happens?
- A. The remaining cards are dealt, and then everyone shows their cards
- B. **You win the pot right away, without showing your cards** ✓
- C. The hand starts over
- *Why:* When everyone else folds, the last player left wins. No showdown is needed.
- *Checked by:* table

**L1-Q2.** How many shared cards are on the table after the turn?
- A. 3
- B. **4** ✓
- C. 5
- *Why:* The flop brings 3, and the turn adds a 4th. The river makes 5.
- *Checked by:* table

**L1-Q3.** In what order do the betting rounds come?
- A. **Preflop, flop, turn, river** ✓
- B. Flop, preflop, river, turn
- C. Preflop, turn, flop, river
- *Why:* Preflop has no shared cards. Then come the flop (3 cards), the turn (1 card), and the river (1 card).
- *Checked by:* table

---

## Lesson 2: Your cards and the board

You get **2 private cards** (your **hole cards**). Nobody else sees them. The **5 shared cards** in the middle are called the **board**, and everyone can use them.

**Your hand is the best 5 cards out of these 7.** You can use both hole cards, just one, or even none:

[Diagram: three rows. Each shows 2 hole cards plus the board, with the 5 cards that count highlighted.]

- **Both cards:** You hold 5♣ 5♦, and the board is 5♥ K♦ 9♣ 2♠ 3♦. Your best hand is three fives: 5♣ 5♦ 5♥ plus K and 9.
- **One card:** You hold A♥ 3♣, and the board is K♥ 9♥ 6♥ 2♥ 10♠. Your best hand is a flush in hearts: A♥ plus the board's four hearts. Your 3♣ doesn't count.
- **No cards ("playing the board"):** You hold J♠ J♦, and the board is A♠ A♦ K♣ K♥ Q♠. The best hand is A-A-K-K-Q, which is all on the board. Your pair of jacks doesn't help, because a hand has only 5 cards. An opponent holding 3♣ 2♦ has exactly the same hand, so you'd split the pot.

**Read the board for what's possible.** Every player shares the same board, so ask: "What's the best hand anyone could have here?" The best possible hand on a given board is called **the nuts**. On K♠ 9♥ 4♣ 2♦ 7♠, nobody can have a straight or a flush, and with no pair on the board, nobody can have a full house. The nuts is three kings, from a player holding two kings.

**Starting hands.** There are 1,326 different 2-card starting hands. You'll hear names like "pocket pair" (two cards of the same rank, such as 7♣ 7♥), "suited" (both cards in the same suit), and "AK" (ace-king). A pocket pair comes about once every 17 hands.

### Quick checks

**L2-Q1.** You hold A♥ 3♣. The board is K♥ 9♥ 6♥ 2♥ 10♠. What's your best hand?
- A. Ace-high
- B. **A flush** ✓
- C. A pair of threes
- *Why:* A♥ plus the four hearts on the board make five hearts. Only one of your cards is needed.
- *Checked by:* evaluator

**L2-Q2.** The board is A♠ A♦ K♣ K♥ Q♠. You hold J♠ J♦, and your opponent holds 3♣ 2♦. Who wins?
- A. You, with the pair of jacks
- B. Your opponent
- C. **It's a tie: both best hands are A-A-K-K-Q** ✓
- *Why:* A hand has 5 cards. A-A-K-K-Q from the board beats anything your jacks could add, so both of you play the board.
- *Checked by:* evaluator

**L2-Q3.** The board is K♠ 9♥ 4♣ 2♦ 7♠. What's the nuts (the best possible hand)?
- A. A flush
- B. **Three kings** ✓
- C. A straight
- *Why:* Only two spades are on the board, so no flush is possible. No straight fits these ranks, and an unpaired board rules out a full house. Two kings in hand make three kings, the best possible hand.
- *Checked by:* evaluator (it tries every possible 2-card hand)

---

## Lesson 3: Hand rankings

From strongest to weakest, with how often each comes up:

[Diagram: a 10-row ladder. Each row shows an example of 5 cards, the name, and a one-line description. The text below is the same content.]

| # | Hand | Example | What it is | How often (7 cards) |
|---|---|---|---|---|
| 1 | **Royal flush** | A♠ K♠ Q♠ J♠ 10♠ | The highest straight flush: 10 to ace, all one suit | 0.00323% (1 in 30,940) |
| 2 | **Straight flush** | 9♥ 8♥ 7♥ 6♥ 5♥ | Five in a row, all one suit | 0.0279% (1 in 3,591) |
| 3 | **Four of a kind** | Q♣ Q♦ Q♥ Q♠ 7♦ | Four cards of one rank | 0.168% (1 in 595) |
| 4 | **Full house** | 8♠ 8♦ 8♣ K♥ K♠ | Three of one rank plus two of another | 2.60% (1 in 39) |
| 5 | **Flush** | A♦ J♦ 8♦ 4♦ 2♦ | Five cards of one suit, in any order | 3.03% (1 in 33) |
| 6 | **Straight** | 10♣ 9♦ 8♠ 7♥ 6♣ | Five ranks in a row, any suits | 4.62% (1 in 22) |
| 7 | **Three of a kind** | 5♣ 5♦ 5♥ K♦ 9♣ | Three cards of one rank | 4.83% (1 in 21) |
| 8 | **Two pair** | J♥ J♣ 4♠ 4♦ A♣ | Two different pairs | 23.5% (1 in 4.3) |
| 9 | **One pair** | 10♠ 10♥ K♣ 7♦ 3♠ | Two cards of one rank | 43.8% (1 in 2.3) |
| 10 | **High card** | A♣ Q♦ 9♠ 6♥ 2♣ | None of the above; the highest card leads | 17.4% (1 in 5.7) |

**How often** is the chance that your 7 cards (your 2 plus all 5 on the board) make that hand as their best, if you see the river. These numbers were counted exactly over all 133,784,560 possible 7-card combinations. They're not your chance of *winning*: your opponents get 7 cards too.

**Notice:** with 7 cards, one pair (43.8%) and two pair (23.5%) are more common than no pair at all (17.4%). That's why a single pair is often not enough to win. Hand rankings come from how rare each hand is in 5-card poker. With 7 cards the order stays the same, with one exception: no pair at all becomes rarer than one pair or two pair.

**Three rules that surprise beginners:**
1. **The ace can be low in a straight:** A-2-3-4-5 is a straight (the lowest one). But a straight can't wrap around, so Q-K-A-2-3 is not a straight.
2. **Suits never break ties.** No suit beats another. On Q♦ J♣ 10♥ 2♠ 3♣, A♥ K♥ and A♠ K♠ both make the same straight and tie. (A suit only matters when five cards of it make a flush. On a board with three hearts, A♥ K♥ would make a flush and win.)
3. **A flush beats a straight.** Flushes are harder to make.

When two hands are the same type, the higher cards win. Lesson 7 covers how ties are broken.

### Quick checks

**L3-Q1.** Board: 9♥ 8♠ 7♥ 2♥ Q♣. Player A holds A♥ 3♥. Player B holds J♦ 10♣. Who wins?
- A. **A, with a flush** ✓
- B. B, with a straight
- C. Tie
- *Why:* A has five hearts (A♥ 3♥ 9♥ 7♥ 2♥). B has a straight (Q-J-10-9-8). A flush beats a straight.
- *Checked by:* evaluator

**L3-Q2.** Board: 5♥ K♦ 9♣ 2♠ 3♦. Player A holds 5♣ 5♦. Player B holds K♠ 9♦. Who wins?
- A. **A, with three of a kind** ✓
- B. B, with two pair
- C. Tie
- *Why:* Three of a kind (three fives) beats two pair (kings and nines).
- *Checked by:* evaluator

**L3-Q3.** Board: 3♠ 4♦ 5♥ K♣ 9♠. Player A holds A♣ 2♦. Player B holds 6♣ 2♥. Who wins?
- A. A, because an ace is the highest card
- B. **B, with a 6-high straight** ✓
- C. Tie, because both have a straight
- *Why:* Both have straights. A's is A-2-3-4-5, where the ace counts as 1, so it's the lowest straight. B's is 2-3-4-5-6, which is higher.
- *Checked by:* evaluator

**L3-Q4.** Board: Q♦ J♣ 10♥ 2♠ 3♣. Player A holds A♥ K♥. Player B holds A♠ K♠. Who wins?
- A. A, because hearts beat spades
- B. B, because spades beat hearts
- C. **Tie** ✓
- *Why:* Both have the same straight, A-K-Q-J-10. Suits never break ties.
- *Checked by:* evaluator

**L3-Q5.** With 7 cards (your 2 plus the 5 on the board), which happens more often?
- A. **Two pair** ✓
- B. High card (no pair at all)
- C. They're equally common
- *Why:* Two pair comes up 23.5% of the time and high card 17.4%. With 7 cards, making at least a pair is more likely than making nothing.
- *Checked by:* math (exact count of all 7-card combinations)

---

## Lesson 4: Seats, the button, and the blinds

**The button** is a marker showing which player is the "dealer" for this hand. It moves one seat to the left (clockwise) after every hand, so everyone takes turns.

[Diagram: a 6-seat table with the button, "SB" and "BB" labels, and arrows showing the order of play before and after the flop.]

**The blinds** are the forced bets that start each pot:
- The **small blind (SB)** sits just left of the button and puts in 1 chip.
- The **big blind (BB)** sits next to the small blind and puts in 2 chips.

They're called "blinds" because they're paid before seeing any cards.

**Posting the blinds isn't a turn.** The small blind and big blind put in their chips automatically before the cards are dealt. Then the real choices begin.

**Order of play** always goes to the left (clockwise):
- **Preflop:** the first player to act sits just left of the big blind. The action goes around the table, and the blinds choose **last**: the small blind, then the big blind. With 6 players, the order is: the seat left of the big blind, the next two seats, the button, the small blind, and the big blind. The blinds act last because their chips already count as bets.
- **Flop, turn, and river:** the first player still in the hand left of the button acts first. **The button acts last.**

**With only two players ("heads-up")** the order flips before the flop. The button posts the small blind and acts first preflop. The other player posts the big blind. From the flop on, the big blind acts first and the button acts last, as usual. You'll play heads-up first, so this matters right away.

**Why acting last is an advantage.** The player who acts last sees what everyone else did before deciding. If the others check, you might take the pot with a bet. If someone bets big, you can fold cheaply. Your place in the order is called your **position**. Acting last is "being in position."

**The big blind's option.** If everyone just calls the big blind before the flop, the big blind can still check (end the round) or raise. This is called the big blind's **option**.

### Quick checks

**L4-Q1.** Heads-up, you have the button. Who acts first before the flop?
- A. **You** ✓
- B. Your opponent
- *Why:* Heads-up, the button posts the small blind and acts first preflop. After the flop, the order flips back.
- *Checked by:* table

**L4-Q2.** Heads-up, you have the button. Who acts first on the flop?
- A. You
- B. **Your opponent (the big blind)** ✓
- *Why:* From the flop on, the button acts last.
- *Checked by:* table

**L4-Q3.** 4 players. Everyone calls 2 before the flop, and it's the big blind's turn. What may the big blind do?
- A. Only fold or call
- B. **Check or raise** ✓
- C. Nothing; the round is over
- *Why:* The big blind already has 2 in, so there's nothing to call. It may check to end the round or raise. This is the big blind's option.
- *Checked by:* table

**L4-Q4.** Why is acting last an advantage?
- A. The last player gets better cards
- B. **The last player sees what the others did before deciding** ✓
- C. The last player pays less in blinds
- *Why:* Cards are random, and position doesn't change them. Acting last gives you more information.
- *Checked by:* review

---

## Lesson 5: Your moves

When it's your turn, you choose one move:

| Move | When you can | What it does |
|---|---|---|
| **Fold** | Always | Give up the hand. Chips you already put in stay in the pot. |
| **Check** | Only when there's **nothing to call** | Pass without putting in chips. |
| **Call** | When someone bet more than you have in | Put in just enough to match the bet. |
| **Bet** | When nobody has bet this round | Put in chips that others must match. |
| **Raise** | When someone has bet | Put in more than the bet, so others must match the new amount. |

**Facing a bet, you have three choices: fold, call, or raise.** Checking isn't one of them. You can't stay in the hand for free once someone has put in more than you.

**A bet and a raise are the same idea.** A bet is the first chips anyone puts in during a betting round. A raise makes an existing bet bigger. After either one, **every other player still in the hand gets a turn** to fold, call, or raise again, including a player who bet earlier and now faces a raise. Nobody has to match it. They can always fold. The round ends when everyone still in has put in the same amount.

**Why bet or raise at all?** There are two main reasons:
- **For value:** you think your hand is probably best, and you want worse hands to put more chips in the pot.
- **As a bluff:** your hand is probably worse, and you want better hands to fold.

With a medium hand, checking or calling is often better. A bet would mostly get called by better hands and fold out worse ones. Lessons after you start playing go deeper into this, including why bluffing has to be part of good play.

**"Nothing to call" isn't the same as "nobody bet."** The big blind already has 2 in. If everyone just calls 2, the big blind has nothing more to put in, so they may check.

**"Raise to" vs. "raise by."** This app always uses **"raise to"**: the total you'll have in for this betting round.
- The big blind is 2. You **raise to 6**. That's 4 more than the big blind, so you **raised by 4**.

[Diagram: a chip stack of 2 (the big blind), then a stack of 6, with the extra 4 highlighted as "the raise."]

**The minimum bet and raise:**
- The smallest **bet** is the big blind (2).
- A **raise** must be at least as big as the last bet or raise in this round. If A raises to 6 (by 4), the next player must raise to at least 10 (6 + 4).
- There's no maximum in No-Limit Hold'em. You can bet everything you have, which is called going **all-in** (Lesson 6).

### Quick checks

**L5-Q1.** Before the flop, 3 players just call 2 each, and you're the big blind. Can you check?
- A. **Yes** ✓
- B. No, because someone already bet
- *Why:* Your 2 already matches everyone else's 2, so there's nothing to call. You may check, or raise.
- *Checked by:* table

**L5-Q2.** The big blind is 2. A raises to 6. What's the smallest raise you can make?
- A. To 8
- B. **To 10** ✓
- C. To 12
- *Why:* A raised by 4 (from 2 to 6). Your raise must also be at least 4 more, so you must raise to at least 10.
- *Checked by:* table

**L5-Q3.** On the flop, your opponent bets 20. Which moves can you make?
- A. Check or bet
- B. **Fold, call 20, or raise to at least 40** ✓
- C. Only call
- *Why:* Facing a bet, you can't check. A raise must add at least the size of the bet (20), so the smallest raise is to 40.
- *Checked by:* table

**L5-Q4.** You "raise to 30" after a bet of 10. How much did you raise **by**?
- A. 30
- B. **20** ✓
- C. 10
- *Why:* "To 30" is your total. 30 − 10 = 20 more than the bet.
- *Checked by:* math

**L5-Q5.** 3 players. On the flop, A bets 10, B calls, and C raises to 30. What happens next?
- A. A and B must each put in 20 more
- B. **A and B each choose: fold, call 20 more, or raise again** ✓
- C. The round ends, because C raised last
- *Why:* A raise gives every other player still in the hand a new turn. Nobody is forced to match it; folding is always allowed.
- *Checked by:* table

---

## Lesson 6: All-in

**All-in** means putting in all your chips. You can always call all-in, even with fewer chips than the bet. And whenever you're allowed to raise, you may go all-in even if that's less than a minimum raise.

**When you can't afford a call:** your opponent bets 100, and you have only 30. You may still call for 30, all-in. You can only win as much from your opponent as you put in yourself, so **the 70 nobody matched goes back to your opponent**.

[Diagram: the opponent's 100 split into 30 (matched, goes into the pot) and 70 (returned).]

**Heads-up, when your opponent is all-in:** you can only call or fold. Raising makes no sense, because nobody is left to match it.

**Heads-up, after an all-in is called,** no more betting can happen. The remaining shared cards are simply dealt out ("run out"), and then the showdown decides.

**An all-in can be smaller than a minimum raise.** If the minimum raise is to 10 and you have only 8, you may still go all-in for 8.

**More than two players?** Two things change, and you'll practice both at a bigger table later:
- The players who still have chips can keep betting against each other. Their extra chips go into a **side pot** that the all-in player can't win.
- **A short all-in may not reopen the betting.** A player who already bet or raised can raise again only if the amount has gone up by at least a full raise since then. For example: A bets 10, B goes all-in for 16 (only 6 more), and C calls. A may call the 6 or fold, but may not raise. If A had only checked, A could raise. And if several short all-ins add up to a full raise, A may raise again.

Heads-up never needs side pots.

### Quick checks

**L6-Q1.** You have 30 chips. Your opponent bets 100. What can you do?
- A. Only fold, because you can't afford it
- B. **Fold, or call all-in for 30** ✓
- C. Call 100 by borrowing chips
- *Why:* You can always call all-in for what you have. Your opponent's extra 70 goes back to them.
- *Checked by:* table

**L6-Q2.** In the example above you call all-in for 30. How much of your opponent's bet goes into the pot?
- A. 100
- B. **30** ✓
- C. 70
- *Why:* You can only win as much from your opponent as you put in yourself. The other 70 is returned.
- *Checked by:* table

**L6-Q3.** Both players are all-in on the flop. What happens next?
- A. Betting continues on the turn
- B. **The turn and river are dealt with no betting, then the showdown** ✓
- C. The hand ends, and the pot is split
- *Why:* Nobody has chips left to bet, so the remaining cards are dealt out.
- *Checked by:* table

---

## Lesson 7: The showdown

At the showdown, the remaining players show their cards, and the best five-card hand wins.

**Kickers break ties between equal hands.** A **kicker** is a card that doesn't make up the pair or other combination but still counts toward the 5.
- Board: A♦ 8♣ 4♠ 9♥ 2♣. You hold A♠ K♦; your opponent holds A♣ Q♥.
- Both have a pair of aces. Compare the next-highest cards: your K beats their Q. **You win.**
- Kickers are compared one at a time, highest first, until one is different.

[Diagram: both 5-card hands side by side, with the deciding cards (K vs. Q) highlighted.]

**Sometimes the kicker is on the board.** Board: A♠ K♣ K♠ Q♦ J♥. You hold A♣ 3♦; your opponent holds A♦ 4♥. Both best hands are A-A-K-K-Q. Your 3 and their 4 don't play, so you **split the pot**.

**Split pots.** When hands are exactly equal, the pot is shared equally. If it can't be split evenly, the leftover chip goes to the tied player sitting first to the left of the button.

**Showing and mucking.** In a real game, a player who loses at showdown may **muck**: throw their cards away face down without showing them. In this app, all hands at the showdown are shown, so you can learn from them.

### Quick checks

**L7-Q1.** Board: A♦ 8♣ 4♠ 9♥ 2♣. You hold A♠ K♦; your opponent holds A♣ Q♥. Who wins?
- A. **You, with the king kicker** ✓
- B. Your opponent
- C. Tie
- *Why:* Both have a pair of aces. The next card decides: K beats Q.
- *Checked by:* evaluator

**L7-Q2.** Board: A♠ K♣ K♠ Q♦ J♥. You hold A♣ 3♦; your opponent holds A♦ 4♥. Who wins?
- A. Your opponent, because 4 beats 3
- B. **Tie** ✓
- C. You
- *Why:* Both best hands are A-A-K-K-Q. The fifth card comes from the board, so the 3 and the 4 don't play.
- *Checked by:* evaluator

**L7-Q3.** Does a heart beat a spade when two hands are otherwise equal?
- A. Yes
- B. **No, suits never break ties** ✓
- *Why:* All suits are equal. Equal hands split the pot.
- *Checked by:* evaluator

---

## Lesson 8: Guided practice hands

You'll play 4 short hands against a bot. Each one teaches a different way a hand can end. The cards are fixed so the coach can walk you through each step. The coach only talks about what you can see, just like in a real game, and never peeks at the bot's cards.

**Setup for every hand:** heads-up, blinds 1/2, both players start with 200. The hands alternate which of you has the button, so you practice both seats.

At each step, the app asks you for one move and explains it. These moves are chosen to show each part of a hand. They're reasonable plays, but not always the only good ones. (Random hands come in the Play area, Step 5.)

### Hand 1: Winning at the showdown

You have the button. **Your cards:** A♠ K♦

1. **Preflop.** You posted the small blind (1), and the bot posted the big blind (2). As the button, you act first.
   - *Coach:* "A-K is one of the strongest starting hands. Let's raise to 6."
   - **You raise to 6.** The bot calls. The pot is 12.
2. **Flop: A♦ 8♣ 4♠.** The bot acts first after the flop, and it checks.
   - *Coach:* "You made a pair of aces with a king kicker, which is very strong on this board. Bet to build the pot."
   - **You bet 8.** The bot calls. The pot is 28.
3. **Turn: 9♥.** The bot checks.
   - *Coach:* "Checking is fine too. It keeps the pot smaller, and you act last on the river anyway."
   - **You check.**
4. **River: 2♣.** The bot bets 14.
   - *Coach:* "Your opponent's bet doesn't tell you their cards. Bots and people sometimes bet with weak hands (a **bluff**). You'd need to win more than 1 time in 4 for this call to pay off. That's Lesson 9."
   - **You call 14.** The pot is 56.
5. **Showdown.** The bot shows Q♣ J♣, which is queen-high (no pair). **Your pair of aces wins the 56-chip pot**, and you end the hand 28 chips up.
   - *Coach:* "The bot was bluffing. Notice that its calls earlier didn't mean it had a strong hand."

### Hand 2: Folding early

The bot has the button, so you're the big blind. **Your cards:** 7♣ 2♦

1. **Preflop.** The bot (small blind) acts first and raises to 6.
   - *Coach:* "7-2 with different suits is one of the weakest starting hands. Calling would cost 4 more chips with a hand that rarely wins. Folding loses only the 2 you already posted."
   - **You fold.** The bot wins the pot. Its extra 4 chips that you didn't match come back to it, so it wins just your 2.
   - *Coach:* "Folding weak hands early is how good players save chips. You lost 2, not more. The bot's cards stay hidden: when everyone folds, the winner doesn't show."

### Hand 3: Winning when the bot folds

You have the button. **Your cards:** 9♠ 9♦

1. **Preflop.** You act first.
   - *Coach:* "A pair of nines is a good starting hand. Raise to 6."
   - **You raise to 6.** The bot calls. The pot is 12.
2. **Flop: K♣ 7♥ 3♠.** The bot checks.
   - *Coach:* "There's a king on the board, so your nines aren't the top pair, but they're still a pair. Many hands the bot could hold missed this flop. A bet of half the pot may win it right now."
   - **You bet 6.** The bot folds.
   - *Coach:* "You won the 12-chip pot without a showdown: 6 chips profit. The turn and river are never dealt, and nobody shows cards."

### Hand 4: A split pot

The bot has the button, so you're the big blind. **Your cards:** A♦ 4♣

1. **Preflop.** The bot calls 1 more chip to match your big blind.
   - *Coach:* "Nobody raised, so you have the big blind's option: check or raise. Let's check and see the flop."
   - **You check.** The pot is 4.
2. **Flop: A♠ K♣ K♠.** You act first now.
   - *Coach:* "You have two pair, aces and kings. Let's check and see what the bot does."
   - **You check.** The bot bets 4.
   - *Coach:* "Your hand is good, but a bot with a king would have three kings or better. Calling keeps the pot small."
   - **You call 4.** The pot is 12.
3. **Turn: Q♦.** **You check,** and the bot checks.
4. **River: J♥.** **You check,** and the bot checks.
5. **Showdown.** The bot shows A♥ 3♠. Both best hands are **A-A-K-K-Q**: the ace from your hand plus the board. Your 4 and its 3 don't play. **The pot is split, 6 each.** You end the hand even.
   - *Coach:* "When the board gives everyone the same kickers, equal hands split the pot. This is Lesson 7 in action."

**After the four hands,** the app offers "Play them again" (same cards) and "Next lesson."

### Quick checks

**L8-Q1.** In Hand 1, who acted first on the flop?
- A. You
- B. **The bot (the big blind)** ✓
- *Why:* Heads-up, the button acts last after the flop.
- *Checked by:* table

**L8-Q2.** In Hand 1, how many chips did you win overall?
- A. 56
- B. **28** ✓
- C. 14
- *Why:* The pot was 56, but 28 of it was yours (6 + 8 + 14). Your opponent's 28 is your profit.
- *Checked by:* table

**L8-Q3.** In Hand 2, you folded the big blind. How many chips did you lose?
- A. 6
- B. **2** ✓
- C. 0
- *Why:* You lose only what you already put in: your 2-chip blind. The bot's unmatched 4 went back to it.
- *Checked by:* table

**L8-Q4.** In Hand 3, why didn't anyone show their cards?
- A. **The bot folded, so you won without a showdown** ✓
- B. The bot's cards were mucked at the showdown
- C. Cards are never shown in heads-up
- *Why:* A showdown only happens when two or more players are still in after the last betting round.
- *Checked by:* table

---

## Lesson 9: Expected value and pot odds

**Will a call pay off on average?** You'll face this question again and again. Even a call that loses this time can be right if it wins enough over many repeats.

**Expected value (EV)** is how much a decision wins or loses on average, if you could repeat it many times.

**Pot odds** compare the price of a call with the pot you could win.
- **P** = the pot, including your opponent's bet.
- **C** = what you must put in to call.
- If you call, you win **P + C** in total (the pot plus your own call back) or lose **C**.

**The break-even chance** is **C ÷ (P + C)**. If your chance of winning is higher, calling earns more on average than folding.

[Diagram: a pie split into "your call" (C) and "the pot" (P), labeled with the break-even percentage.]

**Example (the rules of this example):** It's heads-up on the turn, with one card to come. Your opponent has gone all-in, so your call ends the betting. To make the math exact, **we'll pretend you know your opponent's cards**. In real play you don't, but the method is the same.

- Board: K♥ 9♥ 2♣ 3♠. You hold 7♥ 6♥; your opponent holds K♠ J♦ (a pair of kings).
- You're behind, but any heart on the river gives you a flush. 9 hearts are left among the 44 unseen cards, and no other card helps you. These winning cards are called **outs**.
- Your chance of winning: 9 ÷ 44 ≈ **20.5%**. No river card makes a tie.

**Case 1:** the pot is 100 (including the bet), and you must call 50.
- Break-even: 50 ÷ 150 = 33.3%. Your 20.5% is lower, so **fold**.
- EV of calling: 20.5% × 150 − 50 ≈ **−19 chips** per call, on average.

**Case 2:** the pot is 200, and you must call 25.
- Break-even: 25 ÷ 225 = 11.1%. Your 20.5% is higher, so **call**.
- EV of calling: 20.5% × 225 − 25 ≈ **+21 chips** per call, on average.

Same cards, different prices, different answers. The price matters as much as your hand.

**Ties count as half.** If a river card would split the pot, count it as half a win.

**A shortcut: the rule of 2 and 4.** Count your outs. With one card to come, multiply by 2. With two cards to come and no more betting (for example, someone is all-in on the flop), multiply by 4. It's only an estimate. For a flush draw on the flop (9 outs, 47 unseen cards, and every out a winner), 9 × 4 = 36%, while the exact chance is 35.0%. With many outs it overestimates more: 15 × 4 = 60%, but the exact chance is 54.1%.

**Careful with outs:** some "outs" can still lose. For example, they might also give your opponent a better hand. The app's checks count every card exactly.

**Later:** in real play, you'll also think about chips you might win or lose on later rounds (called **implied odds**). That comes after you've played some hands.

### Quick checks

**L9-Q1.** The pot is 60 (including the bet), and you must call 20. What chance of winning do you need to break even?
- A. 33%
- B. **25%** ✓
- C. 20%
- *Why:* 20 ÷ (60 + 20) = 20 ÷ 80 = 25%.
- *Checked by:* math

**L9-Q2.** In the example above (20.5% to win), the pot is 100 and you must call 50. Call or fold?
- A. Call
- B. **Fold** ✓
- *Why:* You need 33.3%, but you have 20.5%. Calling loses about 19 chips on average.
- *Checked by:* math (exact count of all 44 river cards)

**L9-Q3.** Same cards, but the pot is 200 and you must call 25. Call or fold?
- A. **Call** ✓
- B. Fold
- *Why:* You need 11.1%, and you have 20.5%. Calling wins about 21 chips on average, even though you'll lose most of the time.
- *Checked by:* math (exact count of all 44 river cards)

**L9-Q4.** You have 8 outs on the flop, and you're all-in, so you'll see both the turn and the river. Roughly what's your chance?
- A. About 16%
- B. **About 32%** ✓
- C. About 50%
- *Why:* Rule of 4: 8 × 4 = 32%. (The exact chance is 31.5%.)
- *Checked by:* math

---

## Lesson 10: The gambler's fallacy

**The gambler's fallacy** is the belief that past results change the chances of the next random event: "I've lost five hands in a row, so I'm due a win."

**In poker, the deck is reshuffled every hand.** The cards don't remember the last hand. After a losing streak, your chance of getting good cards in the next hand is exactly the same as always.

**Try it.** The app deals thousands of heads-up hands, with both players' cards shown and no betting. It looks for moments when a player lost three showdowns in a row, and it checks their next starting hand. Is it a **premium hand** (A-A, K-K, Q-Q, or A-K)?

[Diagram, live: two bars. One shows "premium hands after 3 losses in a row." The other shows "premium hands in all hands." Both have a margin-of-error line and the expected 2.56% marked.]

- **The chance** of a premium hand is 34 out of 1,326 starting hands, about **2.56%** (1 in 39). This doesn't change after losses.
- **The counts will wobble.** Over a few hundred cases, the bar might show 2% or 3.5%. That's normal randomness, not a pattern. The margin-of-error line shows how much wobble to expect. As you deal more, the bars settle closer to 2.56% and the margin-of-error lines get shorter.
- The demo deals hands in groups of 4. It looks for groups where the first 3 hands were losses (a tie breaks the streak), then checks the 4th. This keeps every case independent.

**Within one hand, though, seen cards do matter.** If you see 4 hearts, fewer hearts are left in the deck. That's how outs work in Lesson 9. The fallacy is about *separate* shuffles, not cards in the same hand.

**Why this matters for you:** after a few losses, it's tempting to play worse hands because you feel "due," or to bet bigger to win it back. Losing streaks happen by chance, even to the best players. Judge each decision on its own.

### Quick checks

**L10-Q1.** You've lost 6 hands in a row. Is your next hand more likely to be a good one?
- A. Yes, you're due
- B. **No, the chance is the same as always** ✓
- C. No, losing makes bad cards more likely
- *Why:* Each hand is a new shuffle. The deck doesn't remember earlier hands.
- *Checked by:* review (the simulation shows it)

**L10-Q2.** The simulation shows premium hands at 3.1% after losing streaks, compared with 2.56% overall. What does that mean?
- A. Losing streaks bring better cards
- B. **Probably random wobble; check the margin of error** ✓
- C. The shuffle is broken
- *Why:* A small sample always differs a little from the true chance. With more hands, it gets closer to 2.56%.
- *Checked by:* review

**L10-Q3.** On the flop, you see 4 hearts (2 in your hand and 2 on the board). Are hearts now less likely on the turn than if you hadn't seen any?
- A. **Yes, because fewer hearts are left in the unseen cards** ✓
- B. No, that's the gambler's fallacy
- *Why:* Within one hand, cards you've seen are gone from the deck. The fallacy is only about separate shuffles.
- *Checked by:* review

---

# After you start playing (Step 5)

These four lessons come after the Play area opens, so they can point back to hands you've played.

## Lesson 11: Why bluffing works

**A bluff** is a bet with a hand that's probably worse, hoping better hands fold. It can seem like a trick, but game theory (the math of decisions against an opponent who is also thinking) shows that good play *needs* some bluffs.

**A tiny game to see why.** It's the river. The pot is 100. You either have the best possible hand or nothing at all, with equal chances, and your opponent knows that. Your opponent always holds a medium hand: it beats nothing and loses to your best hand. You may check (then the cards are shown) or bet exactly 50. If you bet, your opponent calls or folds. Nothing else can happen.

[Diagram: a two-branch tree. "Best hand" → bet. "Nothing" → bet (bluff) or check. Opponent → call or fold, with the chips won or lost at each end.]

- **If you never bluff,** every bet means the best hand. Your opponent simply folds to every bet, so your strong hands win only the 100 that was already there.
- **If you always bluff,** your bets mean nothing. Your opponent calls every time, and each bluff loses 50.
- **In between, there's a balance.** Calling costs 50 to win 150 (the pot plus your bet), so your opponent's call breaks even when 1 bet in 4 is a bluff. You get there by betting all your best hands and bluffing with 1 in 3 of your "nothing" hands. Then your opponent can't do better by always calling or always folding.
- **The same balance works the other way.** If your opponent calls 2 times in 3, your bluffs break even: you win 100 one time in 3 and lose 50 two times in 3.

Choosing between moves at random, in fixed proportions, is called a **mixed strategy**. The point isn't to be random for its own sake; it's to keep your bets from telling your opponent what you hold.

**The formulas from this game** (pot P, bet B, no other choices):
- A bluff breaks even when your opponent folds exactly **B ÷ (P + B)** of the time, and profits if they fold more often.
- Your opponent's calls break even when **B ÷ (P + 2B)** of your bets are bluffs.

These hold only in this toy game. Real hands have many in-between holdings, more betting rounds, and ties.

**Two practical lessons:**
- Against someone who never folds, don't bluff. Bet your good hands bigger instead.
- Against someone who folds too often, bluff more. This app's bot sometimes bluffs, and so should you, occasionally.

### Quick checks

**L11-Q1.** The pot is 100 and you bluff 50. How often must your opponent fold for the bluff to break even?
- A. **One time in 3 (33%)** ✓
- B. Half the time
- C. One time in 4 (25%)
- *Why:* You risk 50 to win 100. Folding 1 time in 3 wins 100 once and loses 50 twice: 100 − 100 = 0.
- *Checked by:* math

**L11-Q2.** In the tiny game, why does the player with the strong hands need some bluffs?
- A. Bluffs win more than value bets
- B. **Without bluffs, the opponent can fold to every bet and lose nothing extra** ✓
- C. The rules require it
- *Why:* If every bet means the best hand, folding is always right. Bluffs make calling worthwhile, so your strong hands get paid.
- *Checked by:* review

**L11-Q3.** Your opponent never folds. Should you bluff?
- A. Yes, at least 1 time in 3
- B. **No; bet your good hands instead** ✓
- *Why:* A bluff only wins when the opponent folds. Against someone who always calls, every bluff loses.
- *Checked by:* review

---

## Lesson 12: Sunk cost

**A sunk cost** is something you've already paid and can't get back. The trap is letting it drive your next decision: "I've already put 60 in, so I can't fold now."

**Chips in the pot aren't yours anymore.** Once you bet, those chips belong to the pot. Folding doesn't lose them again; they were already gone. The only question is: from here, does the next call pay off on average?

**But don't ignore everything earlier.** Two things from the past still matter:
- **The size of the pot.** Your earlier bets made the pot bigger. The bigger the pot, the smaller the chance of winning you need for the same call to pay off (Lesson 9). For example, calling 20 to win a pot of 40 needs a 33% chance: 20 ÷ (40 + 20). Calling the same 20 to win a pot of 180 needs only 10%: 20 ÷ (180 + 20). That's a real reason to call, and it's the same no matter *who* put those chips in.
- **What the betting told you.** How your opponent bet earlier is information about their hand.

**A test you can use:** imagine someone else had put in your earlier chips, and you just sat down in this exact spot with this pot. Would you call? If yes, call. If no, your earlier chips are no reason to.

### Quick checks

**L12-Q1.** 60 of the pot's chips are ones you put in earlier. On its own, should that change whether you call now?
- A. Yes, protect your 60
- B. **No; on its own it doesn't change what a call wins or costs** ✓
- *Why:* The pot is the same size whoever put the chips in. (What the earlier betting tells you about your opponent's hand still matters.)
- *Checked by:* review

**L12-Q2.** Which earlier fact is a good reason to consider calling?
- A. "I've already put in a lot"
- B. **"The pot is big compared with the price of calling"** ✓
- *Why:* A bigger pot lowers the chance you need to break even. Your own past spending doesn't.
- *Checked by:* review

---

## Lesson 13: Resulting

**Resulting** means judging a decision by how it turned out. In poker that's a trap, because luck decides single hands.

**A good decision can lose.** In Lesson 9's Case 2, calling was right: you needed 11.1% and had 20.5%. Yet you lose that hand about 4 times in 5. Losing it doesn't make the call a mistake.

**A bad decision can win.** Calling in Case 1 (needing 33.3% with 20.5%) loses chips on average. When the heart comes, it wins this time, but it's still a bad habit.

**Even the best spots lose often.** Before the flop, A♥ A♠ all-in against K♣ K♦ wins 81.1% of the time, loses 18.6%, and ties 0.4% (counted over all 1,712,304 possible boards). If you play that spot 10 times, you'll likely lose it at least once.

**Why can the aces lose?** When both players are all-in before the flop, no one can fold anymore, but all 5 shared cards are still to come, and they can change who's ahead:
- **A king comes.** Two kings are still in the deck. If one lands on the board, the kings become three of a kind (or better) and usually beat the pair of aces, unless the aces improve too, for example when an ace also comes. For example, with a board of K♥ 7♣ 2♦ 9♠ 4♥, the kings have K-K-K and the aces have just a pair. This decides about 16 boards in 100.
- **The kings make a straight or a flush.** For example, four clubs on the board give K♣ a flush, and the aces have no club. This decides about 2.6 boards in 100.
- **Together, that's the 18.6%.** The aces' pair is better *now*, but it isn't a finished hand until the river.

**How to judge instead:**
- Ask what you knew *at the moment you decided*: your cards, the board, the pot, the price, and what the betting suggested.
- Ask whether the decision made sense with that information, before looking at how it ended. The Review screen shows each decision this way.
- One result proves little. Many results together can tell you whether a habit works.

### Quick checks

**L13-Q1.** You made a call that needed 11% and had 20%. You lost the hand. Was the call a mistake?
- A. Yes, because you lost
- B. **No; it was right for the information you had** ✓
- *Why:* A call that wins more than it costs on average is right, even though it loses most single tries.
- *Checked by:* review

**L13-Q2.** A♥ A♠ all-in before the flop against K♣ K♦ loses about how often?
- A. Almost never
- B. **About 1 time in 5 (18.6%)** ✓
- C. About half the time
- *Why:* Counted over all 1,712,304 boards, the kings win 18.6% and 0.4% are ties. Strong favorites still lose often.
- *Checked by:* math (exact count of all boards)

---

## Lesson 14: Bankroll and the Kelly criterion

**Your bankroll** is the money you set aside for a game. This app uses play chips only, but the idea matters for any risky choice: how much of what you have should you risk at once?

**The Kelly criterion** (John Kelly, Bell Labs, 1956) answers that for a simple, repeated bet where you know your exact chance of winning. For a bet that pays b for each 1 you risk, with chance p of winning and no ties:

**Kelly fraction = (b × p − (1 − p)) ÷ b**, or nothing if that comes out at zero or less.

**Example:** an even-money bet (b = 1) that wins 55% of the time. Kelly says risk (0.55 − 0.45) ÷ 1 = **10%** of your bankroll each time.

**What Kelly does and doesn't promise:** it makes your bankroll grow fastest *over the long run*. It doesn't promise profit in the short run, and the swings along the way are large.

**Betting too much is worse than betting too little.** Take a typical run of 100 bets in the 55% example: 55 wins and 45 losses. Each win multiplies your bankroll by (1 + the fraction you bet), and each loss by (1 − that fraction). The order doesn't matter, because multiplying gives the same answer in any order. Starting with 100:

| You risk each time | After 55 wins and 45 losses |
|---|---|
| Half Kelly (5%) | about 146 (1.05⁵⁵ × 0.95⁴⁵) |
| Kelly (10%) | about 165 (1.10⁵⁵ × 0.90⁴⁵) |
| Twice Kelly (20%) | about 99 (1.20⁵⁵ × 0.80⁴⁵) |

- **Half Kelly** grows at about three-quarters of Kelly's speed (as a growth rate per bet), with much smaller swings.
- **Twice Kelly** ends up about where it started, even though you won 55% of the time. Losing 20% takes you to 80, and winning 20% from there only gets you back to 96. That drag eats the whole edge, and a little more: its growth per bet is slightly below zero, so over thousands of bets it slowly shrinks (100 becomes about 25 after 10,000 bets).
- Real runs are luckier or unluckier than "55 out of 100", but over many bets this is the typical result.

**Kelly is a guide, not a rule.** Each player chooses how much to risk: full Kelly, half, a quarter, or a simple rule of their own. A smaller fraction grows more slowly but swings less, and it hurts less if you've overestimated your edge.

**Why poker players risk much less than Kelly:**
- In poker, you never know your exact chance of winning, and your edge comes and goes with your opponents and your own play.
- If you overestimate your edge, Kelly tells you to bet too much, and too much is the costly direction.
- So players use fractions of Kelly, or simple rules such as keeping many times the amount they bring to one table.

**Don't use Kelly on single hands.** It's about how much of your bankroll to bring and risk over many games, not how much to bet in one pot. Inside a hand, use pot odds (Lesson 9).

This lesson explains the math; it isn't advice about real money.

### Quick checks

**L14-Q1.** An even-money bet wins 60% of the time. What fraction does Kelly suggest?
- A. 60%
- B. **20%** ✓
- C. 10%
- *Why:* (1 × 0.6 − 0.4) ÷ 1 = 0.2, so 20% of your bankroll.
- *Checked by:* math

**L14-Q2.** In the 55% example, what happens if you always bet twice the Kelly fraction (20%)?
- A. You grow twice as fast
- B. **You don't grow; over a long run you slowly lose** ✓
- C. You can't lose
- *Why:* Betting too much makes the losses hurt more than the wins help. At twice Kelly, growth per bet is slightly below zero: after 100 bets you're about where you started, and after many more you slowly shrink.
- *Checked by:* math

**L14-Q3.** Why do poker players usually risk less than Kelly suggests?
- A. Kelly is only for casinos
- B. **They never know their exact edge, and overbetting is the costly mistake** ✓
- C. Poker doesn't involve risk
- *Why:* Kelly needs a known chance of winning. In poker the edge is uncertain, so a smaller fraction protects against overestimating it.
- *Checked by:* review

---

# At a bigger table (Step 6)

These two lessons come with the 6-player table in Play.

## Lesson 15: Position at a six-player table

With six players, each seat has a name. They're counted from the button:

| Seat | Name | Before the flop | After the flop |
|---|---|---|---|
| Left of the button | **Small blind (SB)** | acts 5th | acts 1st |
| Next | **Big blind (BB)** | acts last (6th) | acts 2nd |
| Next | **Under the gun (UTG)** | acts **first** | acts 3rd |
| Next | **Hijack (HJ)** | acts 2nd | acts 4th |
| Next | **Cutoff (CO)** | acts 3rd | acts 5th |
| The dealer | **Button (BTN)** | acts 4th | acts **last** |

[Diagram: the six-seat table with each seat's name and its place in the order, before and after the flop.]

- **"Under the gun"** is the first player to act before the flop. The name comes from feeling the pressure of acting first.
- The **cutoff** is the seat just before the button, and the **hijack** is the one before that.
- After the flop, the order counts only players still in the hand. If the small blind folded, the big blind acts first.
- The names stay with the seats for the whole hand, even after other players fold. They move one seat to the left with the button for the next hand.

**Why position matters even more with six players:**
- **Acting first is harder.** From under the gun, five players act after you, and any of them could hold a strong hand. A common guideline is to play only your stronger starting hands from early seats.
- **Acting last is easier.** On the button, you've seen what everyone else did before you choose, and you act last on every round after the flop. A common guideline is to play more hands from late seats.
- **The cards don't change; the information does.** Position doesn't make your cards better. It lets you decide with more information.

**More players, stronger hands needed.** When several players stay in, it's more likely that someone holds a strong hand. A pair that was good heads-up is often behind in a five-way pot.

### Quick checks

**L15-Q1.** Six players. Who acts first before the flop?
- A. The small blind
- B. **Under the gun (the seat left of the big blind)** ✓
- C. The button
- *Why:* Before the flop, the first player to act sits just left of the big blind. The blinds act last.
- *Checked by:* table

**L15-Q2.** Six players, everyone still in after the flop. Who acts first?
- A. **The small blind** ✓
- B. Under the gun
- C. The button
- *Why:* After the flop, the first player still in the hand left of the button acts first. The button acts last.
- *Checked by:* table

**L15-Q3.** Why do many players play fewer hands from under the gun than from the button?
- A. The cards are worse in early seats
- B. **Five players still act after them, and they act first after the flop too** ✓
- C. Under the gun pays a bigger blind
- *Why:* Early seats decide with the least information. The cards are random in every seat.
- *Checked by:* review

---

## Lesson 16: Side pots

When a player goes all-in for less than others bet, they can only win as much from each opponent as they put in themselves (Lesson 6). With three or more players, the chips beyond that go into a **side pot** that the all-in player can't win.

**Example.** Three players are all-in before the flop:
- **A** has 30 chips.
- **B** has 80 chips.
- **C** has 100 chips.

[Diagram: three stacked bars of 30, 80, and 100 chips, sliced into the main pot (30 from each), the side pot (50 each from B and C), and C's unmatched 20.]

| Pot | Made of | Amount | Who can win it |
|---|---|---|---|
| **Main pot** | 30 from each player | 90 | A, B, and C |
| **Side pot** | 50 more each from B and C | 100 | B and C only |
| **Returned** | C's last 20, which nobody matched | 20 | goes back to C |

**Each pot has its own winner.** Suppose A has the best hand, B the second best, and C the worst:
- **A wins the main pot (90).** A beat both other players.
- **B wins the side pot (100).** A can't win it, so it goes to the better hand between B and C.
- **C gets back 20** and loses the other 80.

So the shortest stack can win at most the main pot. Winning the main pot doesn't mean winning the side pot.

**Things to keep straight:**
- **A side pot isn't a split pot.** Side pots are separate pots with different players who can win them. A split pot is one pot shared by tied hands.
- **Folded chips stay in.** If someone folds after betting, their chips stay in whichever pots they were in, but they can't win any of them.
- **Ties are settled pot by pot.** Tied hands share each pot they can win. If a pot can't be split evenly, the leftover chip goes to the tied player sitting first to the left of the button.
- **One all-in doesn't stop the others.** Players who still have chips can keep betting against each other, and those bets go into the side pot.

### Quick checks

**L16-Q1.** A is all-in for 30, B for 80, and C bets 100. How big is the main pot?
- A. 30
- B. **90** ✓
- C. 210
- *Why:* Each player can match 30, so the main pot is 30 × 3 = 90.
- *Checked by:* table

**L16-Q2.** In that hand, A has the best hand and B the second best. Who wins the side pot of 100?
- A. A
- B. **B** ✓
- C. It's split between A and B
- *Why:* A didn't put chips into the side pot, so A can't win it. B beats C for it.
- *Checked by:* table

**L16-Q3.** What happens to C's last 20 chips?
- A. They go to the main pot
- B. They go to the side pot
- C. **They go back to C** ✓
- *Why:* Nobody had chips to match them, so they're returned.
- *Checked by:* table

**L16-Q4.** What's the difference between a side pot and a split pot?
- A. **A side pot is a separate pot some players can't win; a split pot is one pot shared by tied hands** ✓
- B. They're the same thing
- C. A split pot only happens with side pots
- *Why:* Side pots exist when someone is all-in for less. Splits happen when hands tie.
- *Checked by:* review
