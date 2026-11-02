// Lesson 8 in Japanese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import { GuidedHands } from "../../GuidedHands";

export function Lesson8() {
  return (
    <>
      <p>
        ボットを相手に短いハンドを4つプレイします。それぞれ違う終わり方をします。コーチが案内できるよう、カードは決まっています。コーチはあなたに見えることだけを話し、ボットのカードを盗み見ることはありません。
      </p>
      <p>
        <b>どのハンドも：</b>ヘッズアップ、ブラインド1/2、両者とも200チップから始めます。あなたとボットが交互にボタンになります。
      </p>
      <p>各ステップで、アプリが1つのアクションを求め、その理由を説明します。これは例であって、唯一の良い選択ではありません。ランダムなハンドは「プレイ」で遊べます。</p>
      <GuidedHands />
    </>
  );
}
