// Lesson 1 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { StreetTimeline } from "../../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson1() {
  return (
    <>
      <p>
        <b>目标是赢得筹码。</b>每一手牌，玩家都会把筹码放进桌子中间的一堆共享筹码里，这堆筹码叫作<T>底池</T>
        。赢下这手牌的人拿走底池。你面前筹码的总数叫作你的<T>筹码量</T>。
      </p>
      <h2>赢得底池的两种方式</h2>
      <ol>
        <li>
          <b>其他人都弃牌。</b>
          <T>弃牌</T>就是放弃这手牌。如果其他所有玩家都弃牌，你立刻赢得底池，不需要亮出你的牌。很多手牌都是这样结束的。
        </li>
        <li>
          <b>摊牌。</b>
          如果最后一轮下注结束后仍有两名或更多玩家在局中，他们会亮出各自的牌。五张牌组合最好的人获胜；牌一样大时平分底池。
        </li>
      </ol>
      <p>每张牌有一个点数（2–10、J、Q、K 或 A）和一种花色：♠ 黑桃、♥ 红桃、♦ 方块或 ♣ 梅花。</p>
      <h2>一手牌有四个下注轮</h2>
      <p>每个下注轮之前都会发牌：</p>
      <StreetTimeline />
      <p>
        在每个下注轮中，玩家轮流下注、跟上别人的下注，或者弃牌（第 5
        课会解释每种行动）。当仍在局中的每个人都已跟上最大的下注额或已投入全部筹码（<T>全下</T>），并且每个还需要做决定的人都已轮到过一次时，这个下注轮就结束了。然后这手牌进入下一阶段。
      </p>
      <p>
        <b>在发任何牌之前，</b>有两名玩家必须先投入强制下注，叫作<T>盲注</T>，这样底池里总有东西可赢。第 4
        课会解释由谁来下盲注。除非某节课另有说明，盲注是 1/2，每名玩家起始有 200 个筹码。
      </p>
    </>
  );
}
