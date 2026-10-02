// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FieldValue } from "~/features/sak/components/field-value/field-value";

describe("FieldValue", () => {
  it("viser label og verdi", () => {
    render(<FieldValue label="Grunnlag" value="250 000 kr" />);

    expect(screen.getByText("Grunnlag")).toBeInTheDocument();
    expect(screen.getByText("250 000 kr")).toBeInTheDocument();
  });

  it("markerer verdien som endret når isChanged er true", () => {
    render(<FieldValue label="Grunnlag" value="250 000 kr" isChanged />);

    const verdiWrapper = screen.getByText("250 000 kr").parentElement;
    expect(verdiWrapper?.className).not.toBe("");
  });

  it("markerer ikke verdien som endret som standard", () => {
    render(<FieldValue label="Grunnlag" value="250 000 kr" />);

    const verdiWrapper = screen.getByText("250 000 kr").parentElement;
    expect(verdiWrapper?.className).toBe("");
  });
});
