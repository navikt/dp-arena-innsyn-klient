// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { SeksjonHeading } from "~/features/sak/components/vedtak-detaljer/SeksjonHeading";

describe("SeksjonHeading", () => {
  it("viser tittelen", () => {
    render(<SeksjonHeading tittel="Sats" />);
    expect(screen.getByText("Sats")).toBeInTheDocument();
  });

  it("viser action-noden når den er gitt", () => {
    render(<SeksjonHeading tittel="Sats" action={<button>Handling</button>} />);
    expect(screen.getByRole("button", { name: "Handling" })).toBeInTheDocument();
  });
});
