// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { EndretMarkering } from "~/features/sak/components/endret/endret-markering";

describe("EndretMarkering", () => {
  it("legger til en css-klasse når erEndret er true", () => {
    render(
      <EndretMarkering erEndret={true}>
        <span>innhold</span>
      </EndretMarkering>,
    );

    const wrapper = screen.getByText("innhold").parentElement;
    expect(wrapper?.className).not.toBe("");
  });

  it("legger ikke til noen css-klasse når erEndret er false", () => {
    render(
      <EndretMarkering erEndret={false}>
        <span>innhold</span>
      </EndretMarkering>,
    );

    const wrapper = screen.getByText("innhold").parentElement;
    expect(wrapper?.className).toBe("");
  });
});
