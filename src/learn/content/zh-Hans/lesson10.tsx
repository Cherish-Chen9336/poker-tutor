// Lesson 10 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { StreakDemo } from "../../thinking";
import { StreakStrip } from "../../visuals";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson10() {
  return (
    <>
      <p>
        <T>赌徒谬误</T>是指相信过去的结果会改变下一次随机事件的概率：“我已经连输五手，该赢一次了。”
      </p>
      <p>
        <b>扑克每手牌都会重新洗牌。</b>牌不会记得上一手。连输之后，你下一手拿到好牌的概率和平时完全一样。
      </p>
      <h2>试一试</h2>
      <p>
        应用会发出成千上万手单挑牌，不下注。它找出摊牌连输三手的情况，再看下一手的起手牌是不是<T>顶级起手牌</T>（A-A、K-K、Q-Q 或 A-K）。
      </p>
      <StreakStrip />
      <StreakDemo />
      <ul>
        <li>
          <b>概率：</b>顶级起手牌占 1,326 种两张牌组合中的 34 种，约 <b>2.56%</b>（39 次中 1 次）。连输之后也不会变。
        </li>
        <li>
          <b>计数会波动。</b>几百个案例时，横条可能显示 2% 或 3.5%。这是正常的随机性，不是规律。95% 区间显示估计概率的不确定程度。随着手数增加，横条整体上趋近 2.56%，95% 区间通常也会变窄。
        </li>
      </ul>
      <p>
        <b>不过，在同一手牌里，见过的牌确实有影响。</b>如果你看到 4 张红桃，牌堆里剩下的红桃就少了。第 9 课的补牌就是这个道理。谬误说的是<i>不同</i>的洗牌，而不是同一手牌中的牌。
      </p>
      <p>
        <b>这对你为什么重要：</b>输了几手后，人很容易因为觉得“该赢了”而玩更差的牌，或者加大下注想赢回来。连输是偶然发生的，最好的玩家也会遇到。每个决定都要单独判断。
      </p>
    </>
  );
}
