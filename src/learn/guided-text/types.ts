/** One guided hand's words in another language: its title, its ending, and the coach line for each scripted step (by script index). */
export interface HandText {
  title: string;
  ending: string;
  coach: Record<number, string>;
}
