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
        <b>目标是赢得筹码。</b>每手牌中，玩家投入桌子中央的筹码组成<T>底池</T>。赢家拿走底池。你面前的筹码总数叫作<T>筹码量</T>。
      </p>
      <h2>赢得底池的两种方式</h2>
      <ol>
        <li>
          <b>其他人都弃牌。</b>
          <T>弃牌</T>就是放弃这手牌。其他人都弃牌时，你将赢得底池，无需亮牌。
        </li>
        <li>
          <b>摊牌。</b>
          最后一轮下注后，若至少两人未弃牌，就亮牌比较各自最好的五张牌。牌大的人获胜，一样大则平分底池。
        </li>
      </ol>
      <p>每张牌有点数（2–10、J、Q、K、A）和花色（♠ 黑桃、♥ 红桃、♦ 方块、♣ 梅花）。</p>
      <h2>一手牌有四个下注轮</h2>
      <p>每轮下注前都会发牌：</p>
      <StreetTimeline />
      <p>
        每个下注轮中，玩家轮流下注、跟注或弃牌（各行动见第 5 课）。当每名未弃牌玩家都达到本轮当前最大下注额或已<T>全下</T>（投入全部筹码），且所有还需行动的人都已行动，本轮就结束，进入下一阶段。
      </p>
      <p>
        <b>发牌前，</b>两名玩家必须先下注，称为<T>盲注</T>，让底池里总有筹码可赢。谁下盲注见第 4 课。除非另有说明，盲注为 1/2，每人起始有 200 个筹码。
      </p>
    </>
  );
}
