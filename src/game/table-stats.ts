// Measures how a table of six bots plays: how often a flop is dealt, how often
// three or more players see it, and how often each seat plays a hand. Used by
// the bot-2 tests to keep its table "shape" within the practice targets.
import { Match, type BotPolicy } from "./match";

export interface TableStats {
  hands: number;
  /** Share of hands where a flop is dealt with players still able to bet. */
  flopSeen: number;
  /** Of those flops, the share with three or more players. */
  multiway: number;
  /** Share of seat-hands where the player voluntarily put chips in before the flop. */
  vpip: number;
  /** Share of seat-hands where the player raised before the flop. */
  pfr: number;
}

export function tableStats(bot: BotPolicy, seeds: number[], handsPerSeed: number): TableStats {
  let hands = 0, flops = 0, multiway = 0, vpip = 0, pfr = 0;
  for (const seed of seeds) {
    let s = seed >>> 0;
    const random = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    // All six seats play the bot, so seat 0 (normally the learner) gets the same history the others do.
    const match = new Match({ bot, players: 6, random, botRandom: random });
    for (let n = 0; n < handsPerSeed; n++) {
      match.dealNext();
      while (!match.handOver) {
        const history = match.current!.moves.map((m) => ({ seat: m.actorSeat, street: m.view.street, move: m.move }));
        match.act(bot(match.view(), match.legalMoves()!, random, history));
      }
      const record = match.current!;
      hands++;
      const flop = record.moves.find((m) => m.view.street === "flop");
      if (flop) {
        flops++;
        if (flop.view.seats.filter((x) => x && x.status !== "folded").length >= 3) multiway++;
      }
      const pre = record.moves.filter((m) => m.view.street === "preflop");
      for (let seat = 0; seat < 6; seat++) {
        const mine = pre.filter((m) => m.actorSeat === seat);
        if (mine.some((m) => m.move.type === "call" || m.move.type === "raise" || m.move.type === "bet")) vpip++;
        if (mine.some((m) => m.move.type === "raise" || m.move.type === "bet")) pfr++;
      }
    }
  }
  return { hands, flopSeen: flops / hands, multiway: flops ? multiway / flops : 0, vpip: vpip / (hands * 6), pfr: pfr / (hands * 6) };
}
