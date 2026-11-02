// Lesson 2 in Japanese (machine-assisted; source: docs/lessons.md, frozen 2026-11-02).
import type { ReactNode } from "react";
import { C } from "../../cards";
import { BestFiveRows } from "../../diagrams";

function T({ children }: { children: ReactNode }) {
  return <b className="term">{children}</b>;
}

export function Lesson2() {
  return (
    <>
      <p>
        あなたには<b>自分だけが見る2枚のカード</b>が配られます。これを<T>ホールカード</T>と呼びます。中央の<b>5枚の共有カード</b>は
        <T>ボード</T>と呼ばれ、全員が使えます。
      </p>
      <p>
        <b>あなたのハンドは、この7枚から選んだ最も強い5枚です。</b>ホールカードは2枚とも、1枚だけ、あるいは1枚も使わなくてもかまいません：
      </p>
      <BestFiveRows />
      <h2>ボードから可能なハンドを読む</h2>
      <p>
        「このボードで作れる最も強いハンドは？」と考えます。そのボードで可能な最も強いハンドを<T>ナッツ</T>と呼びます。
        <C c="Ks" /> <C c="9h" /> <C c="4c" /> <C c="2d" /> <C c="7s" />
        では、ストレートやフラッシュは誰にもできません。ボードにペアがないので、フルハウスもできません。ナッツは、Kを2枚持つ人のスリーカードです。
      </p>
      <h2>スターティングハンド</h2>
      <p>
        2枚のカードの組み合わせは1,326通りあります。<T>ポケットペア</T>（<C c="7c" /> <C c="7h" />
        のように同じランクの2枚）、<T>スーテッド</T>（2枚が同じスート）、「AK」（エースとキング）などの呼び方を耳にするでしょう。ポケットペアはおよそ17ハンドに1回配られます。
      </p>
    </>
  );
}
