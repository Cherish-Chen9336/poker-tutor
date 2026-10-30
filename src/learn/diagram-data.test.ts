import { describe, expect, it } from "vitest";
import { handName, handScore } from "../game/hands";
import { Table } from "../game/table";
import { RANK_LADDER, SEAT_LAYOUTS } from "./diagram-data";

describe("rank ladder", () => {
  it("labels each example with its real hand name", () => {
    for (const row of RANK_LADDER) expect(handName(row.cards), row.name).toBe(row.name);
  });

  it("is ordered strongest first", () => {
    const scores = RANK_LADDER.map((row) => handScore(row.cards));
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    expect(new Set(scores).size).toBe(scores.length);
  });
});

describe("seat order", () => {
  for (const layout of SEAT_LAYOUTS) {
    it(`matches the engine with ${layout.players} players`, () => {
      const table = new Table({
        seats: Array.from({ length: layout.players }, (_, i) => ({ id: `p${i}`, name: `P${i}`, stack: 200 })),
        smallBlind: 1,
        bigBlind: 2,
        random: () => 0.5,
      });
      table.dealHand();
      const order = (street: string) => {
        const seats: number[] = [];
        while (table.view(null).street === street) {
          const seat = table.view(null).actionTo!;
          seats.push(seat);
          const moves = table.legalMoves(seat)!;
          expect(table.move(seat, moves.check ? { type: "check" } : { type: "call" }).ok).toBe(true);
        }
        return seats;
      };
      expect(table.view(null).buttonSeat).toBe(0);
      expect(order("preflop")).toEqual(layout.preflop);
      expect(order("flop")).toEqual(layout.postflop);
    });
  }
});
