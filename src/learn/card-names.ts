// Card codes like "Ah" to symbols and spoken names, in each language.
import type { Locale } from "../i18n/locales";

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

const SUIT_NAMES: Record<Exclude<Locale, "en">, Record<string, string>> = {
  "zh-Hans": { s: "黑桃", h: "红桃", d: "方块", c: "梅花" },
  ja: { s: "スペード", h: "ハート", d: "ダイヤ", c: "クラブ" },
};
const JA_RANKS: Record<string, string> = { A: "エース", K: "キング", Q: "クイーン", J: "ジャック", T: "10" };

/** "ace of hearts", "红桃A", "ハートのエース". */
export function cardName(code: string, locale: Locale = "en"): string {
  if (locale === "zh-Hans") return `${SUIT_NAMES["zh-Hans"][code[1]]}${rankLabel(code)}`;
  if (locale === "ja") return `${SUIT_NAMES.ja[code[1]]}の${JA_RANKS[code[0]] ?? code[0]}`;
  return `${RANK_NAMES[code[0]] ?? code[0]} of ${SUITS[code[1]].name}`;
}

/** Text with card tokens like {Ah} spelled out ("ace of hearts", "红桃A"), for screen-reader announcements. */
export function spokenText(text: string, locale: Locale = "en"): string {
  return text.replace(/\{([2-9TJQKA][shdc])\}/g, (_, code: string) => cardName(code, locale));
}
