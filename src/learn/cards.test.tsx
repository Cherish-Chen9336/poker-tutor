import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CardText } from "./cards";

describe("CardText", () => {
  it("shows only valid card tokens as cards and leaves other braces as text", () => {
    const html = renderToStaticMarkup(<CardText text="{2s}{xx}{3s} and {Ah}" />);
    expect(html.match(/role="img"/g)).toHaveLength(3);
    expect(html).toContain("{xx}");
  });
});
