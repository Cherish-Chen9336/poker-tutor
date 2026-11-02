// Lesson 8 in Simplified Chinese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import { GuidedHands } from "../../GuidedHands";

export function Lesson8() {
  return (
    <>
      <p>
        你将和一个机器人完成 4 手简短的练习，每手的结局都不同。牌是固定的，方便教练引导你。教练只谈你能看到的信息，从不偷看机器人的牌。
      </p>
      <p>
        <b>每手牌：</b>单挑，盲注 1/2，双方起始各 200 个筹码。你和机器人轮流坐庄位。
      </p>
      <p>每一步，应用会请你做一个行动并解释原因。这些只是示例行动，不是唯一的好选择。随机牌局在“实战”中。</p>
      <GuidedHands />
    </>
  );
}
