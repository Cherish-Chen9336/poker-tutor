// Lesson 5 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { RaiseToBy } from "../../diagrams";
import { SituationCards } from "../../visuals";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson5() {
  return (
    <>
      <p>
        轮到你时，先问：<b>我需要跟注吗？</b>
      </p>
      <SituationCards />
      <p>
        <b>需要跟注时，不能过牌。</b>你可以弃牌、跟注，或在允许时加注。你随时可以<T>弃牌</T>：放弃这手牌，已投入的筹码留在底池里。可以免费过牌时却弃牌，等于白白扔掉这手牌。
      </p>
      <p>
        <b>加注就是下更大的注。</b>有人下注或加注后，其他每个还能行动的玩家都会再轮到一次，包括之前下过注的玩家。没人必须跟注。本轮何时结束见第 1 课。
      </p>
      <h2>为什么下注或加注？</h2>
      <ul>
        <li>
          <b>价值下注：</b>你的牌可能最好，希望更差的牌投入更多。
        </li>
        <li>
          <b>诈唬：</b>你的牌可能更差，希望更好的牌弃牌。
        </li>
      </ul>
      <p>牌力中等时，过牌或跟注往往更好：下注可能让更弱的牌弃牌，而更强的牌跟注。</p>
      <h2>“加注到”与“加注增量”</h2>
      <p>
        本应用总是说<b>“加注到”</b>：你本轮投入的总额。大盲注是 2，你<b>加注到 6</b>：比当前下注额 2 高 4，所以<b>加注增量是 4</b>。
      </p>
      <RaiseToBy />
      <h2>最小与最大下注</h2>
      <ul>
        <li>最小的完整<b>下注</b>是大盲注（2）。筹码不够时，可以全部下注。</li>
        <li>
          完整的<b>加注</b>，加注增量至少要等于本轮上一次完整下注或加注的增量。加注到 6（增量 4）之后，下一次完整加注至少要加注到 10。
        </li>
        <li>
          在<T>无限注德州扑克</T>中，唯一的上限是你的筹码量。投入全部筹码就是<T>全下</T>（第 6 课）。
        </li>
      </ul>
    </>
  );
}
