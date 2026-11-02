// Lesson 6 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { AllInRefund } from "../../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson6() {
  return (
    <>
      <p>
        <T>全下</T>就是投入全部筹码。即使筹码比对方的下注少，你也总能全下跟注。只要你可以加注，就可以全下，哪怕不够一次最小加注。
      </p>
      <h2>筹码不够跟注时</h2>
      <p>
        单挑时，对手下注 100，你只有 30。你仍可以全下跟注 30。你从对手那里最多只能赢到你自己投入的数额，所以<b>没人跟上的 70 退还给对手</b>。
      </p>
      <AllInRefund />
      <p>
        <b>单挑时，对手全下而你需要跟注：</b>你只能跟注或弃牌，因为没有人能再跟你的加注。
      </p>
      <p>
        <b>单挑时，有人全下并被跟注后，</b>不能再下注。剩余公共牌直接发完，由摊牌决定胜负。
      </p>
      <p>
        <b>超过两名玩家？</b>有两点不同，之后你会在更大的牌桌上练习：
      </p>
      <ul>
        <li>
          还有筹码的玩家可以继续互相下注。他们彼此跟上的额外筹码进入全下玩家赢不到的<T>边池</T>；没人跟上的筹码退回。
        </li>
        <li>
          <b>不足额的全下可能不会重新开放加注。</b>已经下注、跟注或加注过的玩家，只有在那之后金额又增加了至少一次完整加注，才能再加注。例如：A 下注 10，B 全下
          16（只多 6），C 跟注。A 可以跟注这 6 或弃牌，但不能加注。如果 A 之前只是过牌，A 可以加注。自 A 上次行动后，几次不足额全下的加注增量合计达到一次完整加注，A 也可以再加注。
        </li>
      </ul>
    </>
  );
}
