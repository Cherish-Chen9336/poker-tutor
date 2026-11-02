// Lesson 2 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { C } from "../../cards";
import { BestFiveRows } from "../../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson2() {
  return (
    <>
      <p>
        你有 <b>2 张只有自己能看到的牌</b>，叫作<T>底牌</T>。桌子中间的 <b>5 张共享牌</b>叫作<T>公共牌</T>，所有人都可以用。
      </p>
      <p>
        <b>你的牌是这 7 张中最好的 5 张。</b>可以用两张底牌、一张，或一张都不用：
      </p>
      <BestFiveRows />
      <h2>看公共牌，判断可能的牌</h2>
      <p>
        问自己：“这里任何人能拿到的最好的牌是什么？”某组公共牌上可能的最好牌叫作<T>坚果牌</T>。在 <C c="Ks" /> <C c="9h" />{" "}
        <C c="4c" /> <C c="2d" /> <C c="7s" /> 上，没人能有顺子或同花；公共牌没有对子，也没人能有葫芦。持有两张 K 可组成三条 K，这就是坚果牌。
      </p>
      <h2>起手牌</h2>
      <p>
        两张牌共有 1,326 种组合。你会听到这些说法：<T>口袋对</T>（两张同点数的牌，如 <C c="7c" /> <C c="7h" />）、<T>同花色</T>
        （两张牌花色相同），以及“AK”（A 和 K）。口袋对大约每 17 手出现一次。
      </p>
    </>
  );
}
