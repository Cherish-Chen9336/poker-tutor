// Shared helpers for engine tests: rigged decks and chip accounting.
import { PokerEngine } from "@pokertools/engine/browser";
import { deckTopFor, shuffleDrawsFor } from "../game/fixed-deal";
import { ActionType, type Action } from "@pokertools/types";

/**
 * Returns a random source that makes the engine's shuffle produce a deck
 * starting with `topCards` (e.g. ["As", "Kd"]). Later calls (the engine also
 * draws one number for the hand ID) return 0.
 */
export function riggedRandom(topCards: string[]): () => number {
  const draws = shuffleDrawsFor(topCards);
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

/**
 * Creates an engine whose first hand gives each seat the listed hole cards
 * and deals the listed 5-card board. Every seat in `stacks` must have chips.
 */
export function fixedTable(hands: string[][], board: string[], stacks: number[]): PokerEngine {
  return riggedTable(deckTopFor({ hands, board }), stacks);
}

/** True if the engine would accept this action from the player in `seat` now. */
export function isLegal(
  engine: PokerEngine,
  seat: number,
  type: ActionType.FOLD | ActionType.CHECK | ActionType.CALL | ActionType.BET | ActionType.RAISE,
  amount?: number,
): boolean {
  const playerId = engine.state.players[seat]!.id;
  const action = (amount === undefined ? { type, playerId } : { type, playerId, amount }) as Action;
  return engine.validate(action).valid;
}

/** Plays the rest of the hand passively: each player checks, or calls if facing a bet. */
export function checkDown(engine: PokerEngine): void {
  while (engine.state.actionTo !== null) {
    const playerId = engine.state.players[engine.state.actionTo]!.id;
    const check = { type: ActionType.CHECK, playerId } as Action;
    engine.act(engine.validate(check).valid ? check : ({ type: ActionType.CALL, playerId } as Action));
  }
}
