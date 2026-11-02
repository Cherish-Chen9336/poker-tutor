# Step 1b, batch 2b: simpler text and visuals (lessons 8, 9, 10, 11, 15)

Each lesson below is the complete proposed text; it replaces the lesson's current text (quizzes unchanged except one wording change noted in Lesson 10). **[Visual: …]** describes a new or changed picture. Pinned facts (the sentences the tests check) are kept word for word.

---

## Lesson 8: Guided practice hands

*(Only this introduction changes. The four scripted hands below it stay exactly as they are.)*

You'll play 4 short hands against a bot, and each one ends a different way. The cards are fixed so the coach can guide you. The coach only talks about what you can see, and never peeks at the bot's cards.

**Every hand:** heads-up, blinds 1/2, both players start with 200. You take turns having the button.

At each step, the app asks for one move and explains it. These are example moves, not the only good choices. Random hands come in the Play area.

---

## Lesson 9: Expected value and pot odds

**Will a call pay off on average?** A call that loses this time can still be right if it wins enough over many repeats.

**Expected value (EV)** is how much a decision wins or loses on average, if you could repeat it many times.

**Pot odds** compare the price of a call with the pot you could win:
- **P** = the pot, including your opponent's bet.
- **C** = what you must put in to call.
- If you win, you receive **P + C** (the pot plus your own call back), a profit of P. If you lose, you lose **C**.

**When your call ends the betting,** the break-even chance is **C ÷ (P + C)**. If your chance of winning is higher, calling earns more on average than folding.

**An example.** It's heads-up on the turn, with one card to come. Your opponent has gone all-in, so your call ends the betting. To make the math exact, **we'll pretend you know your opponent's cards**. In real play you don't, but the method is the same.
- Board: K♥ 9♥ 2♣ 3♠. You hold 7♥ 6♥; your opponent holds K♠ J♦ (a pair of kings).
- Any heart on the river gives you a flush. 9 hearts are left among the 44 unseen cards, and no other card helps you. These winning cards are called **outs**.
- Your chance of winning: 9 ÷ 44 ≈ **20.5%**. No river card makes a tie.

**Case 1:** the pot is 100 (including the bet), and you must call 50. You need 50 ÷ 150 = 33.3% and have 20.5%, so **fold**. Calling loses about **19 chips** on average: 20.5% × 150 − 50.

**Case 2:** the pot is 200, and you must call 25. You need 25 ÷ 225 = 11.1% and have 20.5%, so **call**. Calling earns about **21 chips** on average: 20.5% × 225 − 25.

Same cards, different prices, different answers. Try other amounts:

[Visual: the existing calculator (Case 1 / Case 2 buttons, pot and call fields), with the pie replaced by:
- a strip split into "your call (C)" and "the pot (P)", labeled with the final pot;
- two bars on one 0–100% scale: "You need" and "You have 20.5%".
The results stay as text: break-even chance, your chance, average result. If the average result is about 0: "calling and folding are about equal."]

**Ties count as half** when two players tie: if a river card would split the pot between you and one opponent, count it as half a win. (With more players, a tie pays your share: a third in a three-way tie.)

**A shortcut: the rule of 2 and 4.** Count your outs. With one card to come, multiply by 2. With two cards to come and no more betting (for example, heads-up after an all-in on the flop), multiply by 4. It's only an estimate. For a flush draw on the flop (9 outs, 47 unseen cards, and every out a winner), 9 × 4 = 36%, while the exact chance is 35.0%. With many outs it overestimates more: 15 × 4 = 60%, but the exact chance is 54.1%.

**Careful with outs:** some "outs" can still lose. For example, they might also give your opponent a better hand.

**Later:** in real play, you'll also think about chips you might win or lose on later rounds (called **implied odds**).

---

## Lesson 10: The gambler's fallacy

**The gambler's fallacy** is the belief that past results change the chances of the next random event: "I've lost five hands in a row, so I'm due a win."

**In poker, the deck is reshuffled every hand.** The cards don't remember the last hand. After a losing streak, your chance of good cards in the next hand is exactly the same as always.

**Try it.** The app deals thousands of heads-up hands, with no betting. It looks for three showdown losses in a row, then checks the next starting hand. Is it a **premium hand** (A-A, K-K, Q-Q, or A-K)?

[Visual: a four-step strip above the existing demo: "Hand 1: lost → Hand 2: lost → Hand 3: lost → Hand 4: premium?" Caption: "Hands are dealt in separate groups of 4, so every case is independent. A tie breaks the streak."]

[Visual: the existing live demo. Its "95% margin of error" label becomes "95% range".]

- **The chance** of a premium hand is 34 of the 1,326 two-card combinations, about **2.56%** (1 in 39). This doesn't change after losses.
- **The counts will wobble.** Over a few hundred cases, a bar might show 2% or 3.5%. That's normal randomness, not a pattern. The 95% range shows how much wobble to expect. With more hands, the bars tend toward 2.56% and the ranges generally get shorter.

**Within one hand, though, seen cards do matter.** If you see 4 hearts, fewer hearts are left in the deck. That's how outs work in Lesson 9. The fallacy is about *separate* shuffles, not cards in the same hand.

**Why this matters for you:** after a few losses, it's tempting to play worse hands because you feel "due," or to bet bigger to win it back. Losing streaks happen by chance, even to the best players. Judge each decision on its own.

*Quiz L10-Q2:* the choice "Probably random wobble; check the margin of error" becomes "Probably random wobble; check the 95% range". (Same answer.)

---

## Lesson 11: Why bluffing works

**A bluff** is a bet with a hand that's probably worse, hoping better hands fold. It can seem like a trick, but game theory (the math of decisions against an opponent who is also thinking) shows that good play *needs* some bluffs.

**A tiny game to see why.** It's the river. The pot is 100. You have either the best possible hand or nothing at all, with equal chances, and your opponent knows that. Your opponent always holds a medium hand: it beats nothing and loses to your best hand. You may check (then the cards are shown) or bet exactly 50. If you bet, your opponent calls or folds.

[Visual: the existing decision tree.]

- **If you never bluff,** every bet means the best hand. Your opponent folds to every bet, so your strong hands win only the 100 already there.
- **If you always bluff,** your opponent calls every time, and each bluff loses 50.
- **In between, there's a balance.** Calling costs 50 to win 150 (the pot plus your bet), so your opponent's call breaks even when 1 bet in 4 is a bluff. You get there by betting all your best hands and bluffing with 1 in 3 of your "nothing" hands. Then your opponent can't do better by always calling or always folding.

[Visual: six tokens for six equally likely cases: three "best hand: bet", one "nothing: bluff", two "nothing: check". Two brackets: "1 of the 3 'nothing' hands is a bluff" and "1 of the 4 bets is a bluff". Text equivalent in the caption.]

- **The same balance works the other way.** If your opponent calls 2 times in 3, your bluffs break even: you win 100 one time in 3 and lose 50 two times in 3.

Choosing between moves at random, in fixed proportions, is called a **mixed strategy**. The point is to keep your bets from telling your opponent what you hold.

**The formulas from this game** (pot P, bet B, no other choices):
- A bluff breaks even when your opponent folds exactly **B ÷ (P + B)** of the time, and profits if they fold more often.
- Your opponent's calls break even when **B ÷ (P + 2B)** of your bets are bluffs.

These hold only in this toy game. Real hands have many in-between holdings, more betting rounds, and ties.

**Two practical lessons:**
- Against someone who never folds, don't bluff. Bet your good hands bigger instead.
- Against someone who folds too often, bluff more. This app's bot sometimes bluffs, and so should you, occasionally.

---

## Lesson 15: Position at a six-player table

With six players, each seat has a name, counted clockwise from the button. Switch between "Before the flop" and "After the flop" to see when each seat acts:

[Visual: the existing six-seat diagram.]

- **"Under the gun"** is the first player to act before the flop. The name comes from the pressure of acting first.
- The **cutoff** is the seat just before the button, and the **hijack** is the one before that.
- After the flop, start left of the button and skip anyone who folded or is all-in.
- The names stay with the seats for the whole hand. They move one seat to the left with the button for the next hand.

**Why position matters even more with six players:**
- **Acting first is harder.** From under the gun, five players act after you, and any of them could hold a strong hand. A common guideline is to play only your stronger starting hands from early seats.
- **Acting last is easier.** On the button, you act last after the flop, so you see everyone else's choices first. A common guideline is to play more hands from late seats.
- **The cards don't change; the information does.** Position doesn't make your cards better. It lets you decide with more information.

**More players, stronger hands needed.** When several players stay in, it's more likely that someone holds a strong hand. A pair that was good heads-up is often behind in a five-way pot.

**About the practice bots.** The bots at this table are simplified practice opponents, not strong players. They call more often than careful players do, so you'll often see pots with three or more players. Against players who call a lot, a common guideline is to **bet your good hands for value** (so worse hands pay you) and **bluff less** (a bluff only works when the other players fold).
