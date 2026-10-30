// Card codes like "Ah" to symbols and spoken names.

export const SUITS: Record<string, { symbol: string; name: string; red: boolean }> = {
  s: { symbol: "♠", name: "spades", red: false },
  h: { symbol: "♥", name: "hearts", red: true },
  d: { symbol: "♦", name: "diamonds", red: true },
  c: { symbol: "♣", name: "clubs", red: false },
};
const RANK_NAMES: Record<string, string> = { A: "ace", K: "king", Q: "queen", J: "jack", T: "10" };

export function rankLabel(code: string): string {
  return code[0] === "T" ? "10" : code[0];
}

export function cardName(code: string): string {
  return `${RANK_NAMES[code[0]] ?? code[0]} of ${SUITS[code[1]].name}`;
}
