// Lesson 7 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { C } from "../../cards";
import { KickerCompare } from "../../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson7() {
  return (
    <>
      <p>摊牌时，剩下的玩家亮牌，五张牌组合最好的人获胜。</p>
      <h2>牌型相同时，踢脚可能决定胜负</h2>
      <p>
        <T>踢脚</T>是不属于对子等组合、但仍算在五张牌里的牌。先比组合的点数，再比踢脚。两对先比大对子，再比小对子；葫芦先比三张，再比对子。之后才从大到小比踢脚。顺子和同花顺比最大的牌，A-2-3-4-5
        算作最大牌为 5。同花和高牌从大到小比全部五张。
      </p>
      <p>
        公共牌：<C c="Ad" /> <C c="8c" /> <C c="4s" /> <C c="9h" /> <C c="2c" />。你持有 <C c="As" /> <C c="Kd" />；对手持有{" "}
        <C c="Ac" /> <C c="Qh" />。
      </p>
      <KickerCompare />
      <p>
        <b>有时踢脚在公共牌上。</b>公共牌：<C c="As" /> <C c="Kc" /> <C c="Ks" /> <C c="Qd" /> <C c="Jh" />。你持有{" "}
        <C c="Ac" /> <C c="3d" />；对手持有 <C c="Ad" /> <C c="4h" />。3 和 4 都不在最好的五张里：双方都是 A-A-K-K-Q，所以
        <b>平分底池</b>。
      </p>
      <h2>平分底池</h2>
      <p>两手牌完全一样大时，底池平分。分不开的零头筹码从庄位左边开始，一次一个分给打平的玩家。</p>
      <h2>亮牌与盖牌</h2>
      <p>
        在真实牌局中，摊牌输了的玩家可以<T>盖牌</T>：不亮牌，把牌面朝下扔掉。本应用会亮出所有参与摊牌玩家的牌，方便你学习。
      </p>
    </>
  );
}
