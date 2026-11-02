// Lesson 4 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { SeatMap } from "../../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson4() {
  return (
    <>
      <p>
        <T>庄家按钮</T>标出这手牌的“庄家”，它所在的座位叫<T>庄位</T>。每手牌后，按钮向左（顺时针）移动一个座位，大家轮流当庄。
      </p>
      <h2>盲注</h2>
      <p>盲注是看牌前必须投入的强制下注。三名或更多玩家时：</p>
      <ul>
        <li>
          庄位左边的<T>小盲位（SB）</T>投入 1 个筹码。
        </li>
        <li>
          小盲位左边的<T>大盲位（BB）</T>投入 2 个筹码。
        </li>
      </ul>
      <p>下盲注在发牌前自动完成，不能代替该玩家的行动回合。</p>
      <p>
        <b>你会先打单挑（两名玩家）。</b>这时庄位同时下小盲注。庄位在翻牌前<b>先</b>行动，翻牌后<b>最后</b>行动。
      </p>
      <h2>行动顺序</h2>
      <SeatMap initialPlayers={2} />
      <p>行动总是向左（顺时针）进行：</p>
      <ul>
        <li>
          <b>翻牌前，</b>从大盲位左边开始，最后轮到盲注：先小盲位，再大盲位。
        </li>
        <li>
          <b>翻牌后，</b>庄位左边第一个还能行动的玩家先行动。<b>庄位最后行动。</b>
        </li>
      </ul>
      <h2>为什么最后行动有利</h2>
      <p>
        你能先看到其他人怎么做，再做决定。如果他们都过牌，你可能通过下注拿下底池；如果有人下大注，你可以花很少的代价弃牌。你在行动顺序中的位置叫作
        <T>位置</T>；最后行动叫作“<T>有位置优势</T>”。
      </p>
      <p>
        <b>大盲位的选择权。</b>如果翻牌前所有人都只跟注大盲注，大盲位仍可以过牌（结束本轮）或加注。这叫<T>大盲位的选择权</T>。
      </p>
    </>
  );
}
