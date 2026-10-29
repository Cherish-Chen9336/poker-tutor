// Shared helpers for engine tests: rigged decks and chip accounting.
import { PokerEngine } from "@pokertools/engine/browser";
import { getCardCode } from "@pokertools/evaluator";
import type { Action, ActionType } from "@pokertools/types";

/**
 * The engine's unshuffled deck order (copied from its utils/deck.js, which
 * isn't exported): card code = rank * 4 + suit, ranks 2..A, suits s/h/d/c.
 */
function createDeck(): number[] {
  return Array.from({ length: 52 }, (_, code) => code);
}

/**
 * Returns a random source that makes the engine's Fisher-Yates shuffle
 * produce a deck starting with `topCards` (e.g. ["As", "Kd"]), followed by
 * the remaining cards in their default order. Calls after the shuffle
 * (the engine also draws one number for the hand ID) return 0.
 */
export function riggedRandom(topCards: string[]): () => number {
  const defaultDeck = createDeck();
  const top = topCards.map(getCardCode);
  const target = [...top, ...defaultDeck.filter((code) => !top.includes(code))];

  // Replay the shuffle backwards: for each position i from the end, pick the
  // index j that swaps the target card into place.
  const working = [...defaultDeck];
  const draws: number[] = [];
  for (let i = working.length - 1; i > 0; i--) {
    const j = working.indexOf(target[i]);
    draws.push((j + 0.5) / (i + 1));
    [working[i], working[j]] = [working[j], working[i]];
  }
  let next = 0;
  return () => draws[next++] ?? 0;
}

/** Creates an engine whose first hand is dealt from a rigged deck. */
export function riggedTable(topCards: string[], stacks: number[]): PokerEngine {
  const engine = new PokerEngine({
    smallBlind: 1,
    bigBlind: 2,
    maxPlayers: stacks.length,
    randomProvider: riggedRandom(topCards),
  });
  stacks.forEach((stack, seat) => engine.sit(seat, `p${seat}`, `Player ${seat}`, stack));
  return engine;
}

/**
 * Total chips at the table: stacks, collected pots, and bets still in front
 * of players this street. Must never change during a hand.
 */
export function totalChips(engine: PokerEngine): number {
  const { players, pots, currentBets } = engine.state;
  const stacks = players.reduce((sum, p) => sum + (p?.stack ?? 0), 0);
  const potTotal = pots.reduce((sum, pot) => sum + pot.amount, 0);
  const bets = [...currentBets.values()].reduce((sum, bet) => sum + bet, 0);
  return stacks + potTotal + bets;
}

/** Acts for the player in `seat`, failing loudly if it isn't their turn. */
export function act(
  engine: PokerEngine,
  seat: number,
  type: ActionType.FOLD | ActionType.CHECK | ActionType.CALL | ActionType.BET | ActionType.RAISE,
  amount?: number,
): void {
  if (engine.state.actionTo !== seat) {
    throw new Error(`Expected seat ${seat} to act, but it is seat ${engine.state.actionTo}`);
  }
  const playerId = engine.state.players[seat]!.id;
  engine.act((amount === undefined ? { type, playerId } : { type, playerId, amount }) as Action);
}

/** Net chips each seat won or lost this hand, given starting stacks. */
export function netResults(engine: PokerEngine, startingStacks: number[]): number[] {
  return startingStacks.map((start, seat) => (engine.state.players[seat]?.stack ?? 0) - start);
}
