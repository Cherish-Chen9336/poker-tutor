# Step 1b, batch 1: simpler text and new visuals (lessons 5, 12, 13, 14, 16) — for the owner's review

Each lesson below is the complete proposed text; it replaces the lesson's current text (quizzes unchanged). **[Visual: …]** describes a new or changed picture; its labels carry what the removed text or table said. Pinned facts (the sentences the tests check) are kept word for word.

---

## Lesson 5: Your moves

When it's your turn, what you can do depends on one question: **do you owe chips?**

[Visual: three situation cards, side by side (stacked on phones):
1. "Nobody has bet this round" → **Check** (pass for free) or **Bet** (put in chips the others must match or fold to).
2. "You're the big blind, and everyone just matched your 2" → **Check** or **Raise**. Nothing to call isn't the same as nobody bet.
3. "Someone bet 20, and you both have chips left" → **Fold**, **Call 20** (match it), or **Raise to at least 40**.]

**If you owe chips, you can't check.** You can fold, call, or raise if allowed. You can always **fold**: you give up the hand, and chips you already put in stay in the pot. Folding when you could check for free just throws the hand away.

**A raise is a bigger bet.** After a bet or raise, every other player who can still act gets a turn, including a player who bet earlier. Nobody has to call. The round ends as Lesson 1 describes.

**Why bet or raise?**
- **For value:** your hand is probably best, and you want worse hands to put in more.
- **As a bluff:** your hand is probably worse, and you want better hands to fold.

With a medium hand, checking or calling is often better.

**"Raise to" vs. "raise by."** This app always says **"raise to"**: your total for this round. The big blind is 2. You **raise to 6**: that's 4 more, so you **raised by 4**.

[Visual: the existing "raise to / raise by" bars, plus a third bar: "next full raise: to at least 10 (6 + 4)".]

**Smallest and largest bets:**
- The smallest **bet** is the big blind (2).
- A full **raise** must add at least as much as the last full bet or raise this round. After a raise to 6 (by 4), the next raise is to at least 10.
- In No-Limit Hold'em, the only maximum is your stack. Betting everything is going **all-in** (Lesson 6).

*Removed:* the five-row move table (now the three cards) and the longer "why bet" paragraph.

---

## Lesson 12: Sunk cost

**A sunk cost** is something you've already paid and can't get back. The trap: "I've already put 60 in, so I can't fold now."

**Chips in the pot aren't yours anymore.** Folding costs no new chips. Judge the next call only by what it costs and what it can win.

**What still matters from earlier:**
- **The size of the pot.** The bigger the pot, the smaller the chance you need for the same call to pay off (Lesson 9), no matter who put the chips in.
- **What the betting told you** about your opponent's hand.

[Visual: two pots side by side, each with the same call of 20 and the call closing the betting.
- "Pot 40 → you need 20 ÷ (40 + 20) = 33%"
- "Pot 180 → you need 20 ÷ (180 + 20) = 10%"
In each pot, some chips have a dashed outline labeled "yours earlier, now the pot's". Caption: "Who put the chips in doesn't change the math. Only the pot and the price do."]

**A test:** keep everything the same (cards, pot, stacks, betting), but imagine someone else put in your earlier chips. Would you call? That's your answer.

*Removed:* the long numeric paragraph (now the two pots).

---

## Lesson 13: Resulting

**Resulting** means judging a decision by how it turned out. But one hand's result depends on both your decision and luck.

[Visual: a 2×2 grid built on Lesson 9's example, shown once above it: you hold 7♥ 6♥, your opponent K♠ J♦, the board is K♥ 9♥ 2♣ 3♠, one card to come, and your call ends the betting. You win only if a heart comes (9 of the 44 unseen cards, 20.5%).
- Rows: **Good call**: pot 200, call 25, you need 11.1%. **Bad call**: pot 100, call 50, you need 33.3%.
- Columns: **A heart comes (you win)** and **No heart (you lose)**.
- Cells: Good call + win: "+200. Right decision, good result." Good call + lose: "−25. Right decision, bad luck. This happens about 4 times in 5." Bad call + win: "+100. Wrong decision, lucky result." Bad call + lose: "−50. Wrong decision, and it lost."
- Caption: "The boxes are the same size, but the chances aren't: without a heart you lose, about 4 times in 5."]

**Even the best spots lose often.** Before the flop, A♥ A♠ all-in against K♣ K♦ wins 81.1% of the time, loses 18.6%, and ties 0.4% (counted over all 1,712,304 possible boards). If you play that spot 10 times, you'll likely lose it at least once.

**Why can the aces lose?** Once both are all-in, nobody can fold, but all 5 shared cards are still to come:
- **A king comes.** The kings become three of a kind (or better) and usually beat the pair of aces, unless the aces improve too, for example when an ace also comes. For example, with a board of K♥ 7♣ 2♦ 9♠ 4♥, the kings have K-K-K and the aces have just a pair. This decides about 16 boards in 100.
- **No king comes, but the kings make a straight or a flush.** For example, four clubs on the board give K♣ a flush, and the aces have no club. This decides about 2.6 boards in 100.

**How to judge instead:** ask what you knew when you decided (your cards, the board, the pot, the price, the betting) and whether the decision made sense with that. The Review screen shows each decision this way. One result proves little; many results can show whether a habit works.

*Removed:* the two paragraphs "a good decision can lose / a bad decision can win" (now the grid) and the "Together, that's the 18.6%" line.

---

## Lesson 14: Bankroll and the Kelly criterion

**Your bankroll** is the money you set aside for a game. This app uses play chips only, but the question matters for any risky choice: how much of what you have should you risk at once?

**The Kelly criterion** (John Kelly, 1956) answers it for a simple bet you repeat many times, when you know your exact chance of winning p, the bet pays b for each 1 you risk, and there are no ties:

**Kelly fraction = (b × p − (1 − p)) ÷ b**, or nothing if that's zero or less.

**Example:** an even-money bet (b = 1) that wins 55% of the time. Kelly says risk (0.55 − 0.45) ÷ 1 = **10%** of your bankroll each time.

**Kelly makes a bankroll grow fastest over the long run.** It doesn't promise short-run profit, and the swings are large.

**Betting too much is worse than betting too little.** Take 100 bets with the typical result, 55 wins and 45 losses, starting with 100. Each win multiplies your bankroll by (1 + the fraction you bet), and each loss by (1 − that fraction). The order doesn't change the final balance: multiplying gives the same answer in any order.

[Visual: three bars starting from 0, with a line marking the starting 100: **Half Kelly (5%) → 146**, **Kelly (10%) → 165**, **Twice Kelly (20%) → 99**. Beside them, a small chain: "100 → lose 20% → 80 → win 20% → 96". Caption: "After 55 wins and 45 losses. Real runs are luckier or unluckier; this is the typical one."]

- **Half Kelly** grows at about three-quarters of Kelly's speed, with much smaller swings.
- **Twice Kelly** ends up about where it started, even though you won 55% of the time. Losing 20% takes you to 80, and winning 20% from there only gets you back to 96. Its growth per bet is slightly below zero, so over thousands of bets it slowly shrinks (100 becomes about 25 after 10,000 bets).

**Kelly is a guide, not a rule.** Many players risk half or a quarter of Kelly: it grows more slowly but swings less, and it hurts less if you've overestimated your edge. In poker you never know your exact edge, and overestimating it makes Kelly bet too much, which is the costly direction.

**Don't use Kelly on single hands.** It's about how much of your bankroll to risk over many games, not what to bet in one pot. Inside a hand, use pot odds (Lesson 9). This lesson explains the math; it isn't advice about real money.

*Removed:* the three-row number table (now the bars) and the separate "why poker players risk less" list (merged into "a guide, not a rule").

---

## Lesson 16: Side pots

When a player goes all-in for less than others bet, they can only win as much from each opponent as they put in themselves (Lesson 6). With three or more players, the others' matched extra chips form a **side pot** the all-in player can't win. Unmatched chips go back.

**Example.** Three players are all-in before the flop: **A** with 30 chips, **B** with 80, and **C** with 100.

[Visual: the existing three stacked bars (30, 80, 100), with a label block beside each band instead of the table:
- **Main pot: 30 × 3 = 90.** A, B, or C can win it.
- **Side pot: 50 × 2 = 100.** Only B or C can win it.
- **Returned: 20 to C.** Nobody matched it.]

**Each pot has its own winner.** Suppose A has the best hand, B the second best, and C the worst:
- **A wins the main pot (90).** A beat both other players.
- **B wins the side pot (100).** A can't win it, so it goes to the better hand between B and C.
- **C gets back 20** and loses the other 80.

So the shortest stack can win at most the main pot.

**Things to keep straight:**
- **A side pot isn't a split pot.** A split pot is one pot shared by tied hands.
- **Folded chips stay in** the pots they went into, but the player who folded can't win them.
- **Ties are settled pot by pot.** Any leftover chips go one at a time to the tied players, starting left of the button.
- **One all-in doesn't stop the others.** Players with chips can keep betting; those bets go into the side pot.

*Removed:* the four-column pot table (now the bar labels) and a repeated sentence.
