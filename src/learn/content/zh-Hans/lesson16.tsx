// Lesson 16 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { SidePotBars } from "../../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson16() {
  return (
    <>
      <p>
        当一名玩家全下的筹码少于其他人的下注时，他从每名对手那里最多只能赢到自己投入的数额（第 6 课）。三名或更多玩家时，其他人彼此跟上的额外筹码组成全下玩家赢不到的<T>边池</T>。没人跟上的筹码退回。
      </p>
      <h2>一个例子</h2>
      <p>
        三名玩家翻牌前都全下：<b>A</b> 有 30 个筹码，<b>B</b> 有 80，<b>C</b> 有 100。
      </p>
      <SidePotBars />
      <p>
        <b>每个底池各有赢家。</b>假设 A 的牌最好，B 第二，C 最差：
      </p>
      <ul>
        <li>
          <b>A 赢得主池（90）。</b>A 赢了另外两名玩家。
        </li>
        <li>
          <b>B 赢得边池（100）。</b>A 赢不到边池，所以它归 B 和 C 中牌更好的一方。
        </li>
        <li>
          <b>C 收回 20</b>，输掉另外 80。
        </li>
      </ul>
      <p>所以筹码最少的玩家最多只能赢得主池。</p>
      <h2>需要分清的几点</h2>
      <ul>
        <li>
          <b>边池不是平分底池。</b>平分底池是打平的牌共享同一个底池。
        </li>
        <li>
          <b>弃牌者的筹码留在</b>他们投入的底池里，但弃牌的玩家赢不到。
        </li>
        <li>
          <b>平局按底池逐个处理。</b>每个底池在打平的赢家之间平分；分不开的零头筹码从庄位左边开始，一次一个分配。
        </li>
        <li>
          <b>一人全下不代表所有人都停止下注。</b>两名或更多还有筹码的玩家可以继续互相下注，进入边池。
        </li>
      </ul>
    </>
  );
}
