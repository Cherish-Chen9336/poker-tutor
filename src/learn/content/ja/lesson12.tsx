// Lesson 12 in Japanese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
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
        <T>サンクコスト</T>とは、すでに支払って取り戻せないものです。落とし穴は「もう60出したから、今さらフォールドできない」という考えです。
      </p>
      <p>
        <b>ポットに入ったチップは、もうあなたのものではありません。</b>フォールドに新たなチップはかかりません。次のコールは、その価格と、平均して得になるかで判断しましょう。
      </p>
      <h2>それでも重要な、これまでの情報</h2>
      <ul>
        <li>
          <b>ポットの大きさ。</b>ポットが大きいほど、同じコールが得になるのに必要な勝率は低くなります（レッスン9）。誰がチップを出したかは関係ありません。
        </li>
        <li>
          <b>これまでのベットからわかる</b>相手のハンドの情報。
        </li>
      </ul>
      <PotCompare />
      <p>
        <b>確かめ方：</b>すべて（カード、ポット、スタック、ベットの流れ）を同じにしたまま、以前のチップを別の誰かが出したと想像します。それでもコールしますか？それが答えです。
      </p>
      <YourHands>「振り返り」で、先にベットしてからリバーでコールしたハンドを探しましょう。以前に自分が出したチップを、別の人が出していたとしても、コールしたでしょうか？</YourHands>
    </>
  );
}
