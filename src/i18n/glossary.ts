// The poker glossary for translations (version 4, 2026-11-02). One entry per
// concept: every translation uses the preferred term, so a learner sees one
// name per idea. These are editorial choices for this app, made by Claude and
// cross-checked by Codex (machine-assisted; no human translator reviewed them).
// `avoid` lists terms a translation must not use for this concept (tested).

export const GLOSSARY_VERSION = 4;

export interface Term {
  id: string;
  en: string;
  zh: string;
  ja: string;
  /** A short label for tight spaces such as table seats. */
  short?: string;
  /** Terms not to use for this concept. */
  avoid?: { zh?: string[]; ja?: string[] };
  note?: string;
}

export const GLOSSARY: Term[] = [
  // Chips and pots
  { id: "chips", en: "chips", zh: "筹码", ja: "チップ" },
  { id: "pot", en: "pot", zh: "底池", ja: "ポット", avoid: { zh: ["奖池"] } },
  { id: "stack", en: "stack", zh: "筹码量", ja: "スタック", note: "The chips in front of one player." },
  { id: "mainPot", en: "main pot", zh: "主池", ja: "メインポット" },
  { id: "sidePot", en: "side pot", zh: "边池", ja: "サイドポット" },
  { id: "splitPot", en: "split pot", zh: "平分底池", ja: "スプリットポット" },
  // Moves
  { id: "fold", en: "fold", zh: "弃牌", ja: "フォールド" },
  { id: "check", en: "check", zh: "过牌", ja: "チェック" },
  { id: "call", en: "call", zh: "跟注", ja: "コール" },
  { id: "bet", en: "bet", zh: "下注", ja: "ベット" },
  { id: "raise", en: "raise", zh: "加注", ja: "レイズ" },
  { id: "allIn", en: "all-in", zh: "全下", ja: "オールイン", avoid: { zh: ["梭哈"] } },
  { id: "muck", en: "muck", zh: "盖牌", ja: "マック", note: "Discard face down at showdown without showing." },
  { id: "noLimit", en: "No-Limit Hold'em", zh: "无限注德州扑克", ja: "ノーリミット・ホールデム" },
  { id: "raiseTo", en: "raise to", zh: "加注到", ja: "レイズ額（合計）", note: "The total for the round, never the increase." },
  { id: "raiseBy", en: "raise by", zh: "加注增量", ja: "レイズの上乗せ分", note: "The increase over the current bet. In prose: 在当前下注额上再加 {amount}." },
  // Rounds and cards
  { id: "hand", en: "hand", zh: "一手牌", ja: "ハンド", note: "One deal from the blinds to the end." },
  { id: "bettingRound", en: "betting round", zh: "下注轮", ja: "ベッティングラウンド" },
  { id: "preflop", en: "preflop", zh: "翻牌前", ja: "プリフロップ" },
  { id: "flop", en: "flop", zh: "翻牌", ja: "フロップ" },
  { id: "turn", en: "turn", zh: "转牌", ja: "ターン" },
  { id: "river", en: "river", zh: "河牌", ja: "リバー" },
  { id: "showdown", en: "showdown", zh: "摊牌", ja: "ショーダウン" },
  { id: "board", en: "board", zh: "公共牌", ja: "ボード", note: "The five shared cards." },
  { id: "holeCards", en: "hole cards", zh: "底牌", ja: "ホールカード" },
  { id: "kicker", en: "kicker", zh: "踢脚", ja: "キッカー" },
  { id: "pocketPair", en: "pocket pair", zh: "口袋对", ja: "ポケットペア", note: "Two hole cards of the same rank." },
  { id: "suited", en: "suited", zh: "同花色", ja: "スーテッド", note: "Both hole cards in one suit; not 同花 (flush)." },
  { id: "runOut", en: "run out (the board)", zh: "发完公共牌", ja: "ボードを最後まで配る" },
  { id: "headsUp", en: "heads-up", zh: "单挑", ja: "ヘッズアップ", note: "Two players." },
  // Seats and blinds: the position and the forced payment are different ideas.
  { id: "button", en: "button (seat)", zh: "庄位", ja: "ボタン", short: "BTN", note: "The position, not the physical marker." },
  { id: "dealerButton", en: "dealer button (marker)", zh: "庄家按钮", ja: "ディーラーボタン" },
  { id: "smallBlindSeat", en: "small blind (seat)", zh: "小盲位", ja: "スモールブラインド", short: "SB" },
  { id: "bigBlindSeat", en: "big blind (seat)", zh: "大盲位", ja: "ビッグブラインド", short: "BB" },
  { id: "blinds", en: "blinds (forced bets)", zh: "盲注", ja: "ブラインド" },
  { id: "smallBlindBet", en: "small blind (the bet)", zh: "小盲注", ja: "スモールブラインド" },
  { id: "bigBlindBet", en: "big blind (the bet)", zh: "大盲注", ja: "ビッグブラインド" },
  { id: "utg", en: "under the gun", zh: "枪口位", ja: "アンダー・ザ・ガン", short: "UTG" },
  { id: "hijack", en: "hijack", zh: "劫位", ja: "ハイジャック", short: "HJ" },
  { id: "cutoff", en: "cutoff", zh: "关煞位", ja: "カットオフ", short: "CO" },
  { id: "position", en: "position", zh: "位置", ja: "ポジション" },
  { id: "inPosition", en: "in position", zh: "有位置优势", ja: "インポジション", note: "Acting last after the flop." },
  { id: "option", en: "the big blind's option", zh: "大盲位的选择权", ja: "ビッグブラインドのオプション" },
  // Suits and ranks
  { id: "spades", en: "spades", zh: "黑桃", ja: "スペード" },
  { id: "hearts", en: "hearts", zh: "红桃", ja: "ハート", avoid: { zh: ["红心"] } },
  { id: "diamonds", en: "diamonds", zh: "方块", ja: "ダイヤ" },
  { id: "clubs", en: "clubs", zh: "梅花", ja: "クラブ" },
  { id: "jack", en: "jack", zh: "J", ja: "ジャック" },
  { id: "queen", en: "queen", zh: "Q", ja: "クイーン" },
  { id: "king", en: "king", zh: "K", ja: "キング" },
  { id: "ace", en: "ace", zh: "A", ja: "エース" },
  // Hand rankings
  { id: "royalFlush", en: "royal flush", zh: "皇家同花顺", ja: "ロイヤルフラッシュ" },
  { id: "straightFlush", en: "straight flush", zh: "同花顺", ja: "ストレートフラッシュ" },
  { id: "fourOfAKind", en: "four of a kind", zh: "四条", ja: "フォーカード" },
  { id: "fullHouse", en: "full house", zh: "葫芦", ja: "フルハウス" },
  { id: "flush", en: "flush", zh: "同花", ja: "フラッシュ" },
  { id: "straight", en: "straight", zh: "顺子", ja: "ストレート" },
  { id: "threeOfAKind", en: "three of a kind", zh: "三条", ja: "スリーカード" },
  { id: "twoPair", en: "two pair", zh: "两对", ja: "ツーペア" },
  { id: "onePair", en: "one pair", zh: "一对", ja: "ワンペア" },
  { id: "highCard", en: "high card", zh: "高牌", ja: "ハイカード" },
  // Ideas
  { id: "nuts", en: "the nuts", zh: "坚果牌", ja: "ナッツ", note: "The best possible hand on a board." },
  { id: "outs", en: "outs", zh: "补牌", ja: "アウツ" },
  { id: "potOdds", en: "pot odds", zh: "底池赔率", ja: "ポットオッズ" },
  { id: "ev", en: "expected value (EV)", zh: "期望值（EV）", ja: "期待値（EV）" },
  { id: "bluff", en: "bluff", zh: "诈唬", ja: "ブラフ" },
  { id: "breakEven", en: "break even", zh: "盈亏平衡", ja: "損益分岐" },
  { id: "impliedOdds", en: "implied odds", zh: "隐含赔率", ja: "インプライドオッズ" },
  { id: "gamblersFallacy", en: "the gambler's fallacy", zh: "赌徒谬误", ja: "ギャンブラーの誤謬" },
  { id: "premiumHand", en: "premium hand", zh: "顶级起手牌", ja: "プレミアムハンド", note: "Here: A-A, K-K, Q-Q, or A-K." },
  { id: "gameTheory", en: "game theory", zh: "博弈论", ja: "ゲーム理論" },
  { id: "mixedStrategy", en: "mixed strategy", zh: "混合策略", ja: "混合戦略" },
  { id: "valueBet", en: "bet for value", zh: "价值下注", ja: "バリューベット" },
  { id: "sunkCost", en: "sunk cost", zh: "沉没成本", ja: "サンクコスト" },
  { id: "resulting", en: "resulting", zh: "结果论", ja: "結果論" },
  { id: "bankroll", en: "bankroll", zh: "资金", ja: "バンクロール", note: "Money set aside for playing." },
  { id: "kelly", en: "the Kelly criterion", zh: "凯利公式", ja: "ケリー基準" },
];

export function term(id: string): Term {
  const found = GLOSSARY.find((t) => t.id === id);
  if (!found) throw new Error(`No glossary term ${id}`);
  return found;
}
