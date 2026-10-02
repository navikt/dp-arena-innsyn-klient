// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { SluttdatoTag } from "~/features/sak/components/slutt-dato-tag/SluttDatoTag";

describe("SluttdatoTag", () => {
  it("viser 'Under 52 uker' når sluttdato er mindre enn 52 uker tilbake", () => {
    const sluttdato = new Date();
    sluttdato.setDate(sluttdato.getDate() - 7);

    render(<SluttdatoTag sluttdato={sluttdato} />);

    expect(screen.getByTestId("sak-under-52-uker")).toHaveTextContent("Under 52 uker");
  });

  it("viser 'Over 52 uker' når sluttdato er mer enn 52 uker tilbake", () => {
    const sluttdato = new Date();
    sluttdato.setDate(sluttdato.getDate() - 400);

    render(<SluttdatoTag sluttdato={sluttdato} />);

    expect(screen.getByTestId("sak-over-52-uker")).toHaveTextContent("Over 52 uker");
  });
});
