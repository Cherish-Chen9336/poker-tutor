// Minimal types for pokersolver, which ships none. Only the parts we use.
declare module "pokersolver" {
  interface SolvedHand {
    name: string;
    descr: string;
  }
  const pokersolver: {
    Hand: {
      solve(cards: string[]): SolvedHand;
      winners(hands: SolvedHand[]): SolvedHand[];
    };
  };
  export default pokersolver;
}
