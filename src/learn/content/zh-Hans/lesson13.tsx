// Lesson 13 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { C } from "../../cards";
import { ResultGrid } from "../../visuals";
import { YourHands } from "../../YourHands";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson13() {
  return (
    <>
      <p>
        <T>结果论</T>是根据结果好坏来评判决定。但一手牌的结果既取决于你的决定，也取决于运气。
      </p>
      <ResultGrid />
      <p>
        <b>再好的局面也常会输。</b>翻牌前，<C c="Ah" /> <C c="As" /> 对 <C c="Kc" /> <C c="Kd" /> 全下，赢 81.1%、输
        18.6%、平 0.4%（按全部 1,712,304 种可能的公共牌计算）。这个局面打 10 次，你很可能至少输一次。
      </p>
      <h2>一对 A 为什么会输？</h2>
      <p>双方都全下后，没人能弃牌，但 5 张公共牌都还没发：</p>
      <ul>
        <li>
          <b>来了一张 K。</b>K 组成三条（或更好），通常能赢一对 A，除非 A 也变强，比如也来了一张 A。例如公共牌是 <C c="Kh" /> <C c="7c" />{" "}
          <C c="2d" /> <C c="9s" /> <C c="4h" /> 时，K 是三条 K，A 只有一对。约每 100 组公共牌中有 16 组是这种情况。
        </li>
        <li>
          <b>没来 K，但 K 组成了顺子或同花。</b>例如公共牌有四张梅花，<C c="Kc" /> 组成同花，而 A 没有梅花。约每 100 组公共牌中有 2.6 组是这种情况。
        </li>
      </ul>
      <p>
        <b>应该怎样评判：</b>问自己做决定时知道什么（你的牌、公共牌、底池、价格、下注过程），以及根据这些信息，这个决定是否合理。复盘页面就是这样展示每个决定的。一次结果说明不了什么；很多次结果才能看出一个习惯好不好。
      </p>
      <YourHands>复盘会在结果之前展示你的每个决定，评语从不取决于这手牌的结局。</YourHands>
    </>
  );
}
