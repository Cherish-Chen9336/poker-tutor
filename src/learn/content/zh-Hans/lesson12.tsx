// Lesson 12 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { PotCompare } from "../../visuals";
import { YourHands } from "../../YourHands";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson12() {
  return (
    <>
      <p>
        <T>沉没成本</T>是已经付出、无法收回的东西。陷阱在于：“我已经投入 60 了，现在不能弃牌。”
      </p>
      <p>
        <b>放进底池的筹码已经不属于你。</b>弃牌不需要投入新筹码。判断下一次跟注，只看它的代价和平均是否划算。
      </p>
      <h2>之前的哪些事仍然重要</h2>
      <ul>
        <li>
          <b>底池大小。</b>底池越大，同样的跟注要划算所需的胜率越低（第 9 课），与筹码是谁投入的无关。
        </li>
        <li>
          <b>之前的下注透露了</b>对手的哪些牌力信息。
        </li>
      </ul>
      <PotCompare />
      <p>
        <b>一个检验方法：</b>其他一切不变（牌、底池、筹码量、下注过程），想象你之前的筹码是别人投入的。你会跟注吗？那就是你的答案。
      </p>
      <YourHands>在复盘中，找一手你先下过注、河牌圈又跟注的牌：如果你之前投入的筹码是别人投入的，你还会跟注吗？</YourHands>
    </>
  );
}
