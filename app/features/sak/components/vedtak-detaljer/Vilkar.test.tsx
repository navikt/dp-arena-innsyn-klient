// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Vilkar } from "~/features/sak/components/vedtak-detaljer/Vilkar";
import type { components } from "../../../../../openapi/arena-sak-innsyn-typer";

function lagVedtak(
  vilkårsvurderinger: components["schemas"]["ArenaVilkarsvurderingResponse"][],
): components["schemas"]["ArenaVedtakMedDetaljerResponse"] {
  return {
    lopenrvedtak: 1,
    fakta: [],
    vilkårsvurderinger,
  };
}

describe("Vilkar", () => {
  it("viser seksjonstittel og vilkårene for vedtaket", () => {
    const vedtak = lagVedtak([
      {
        vilkårsvurderingId: 1,
        vilkårkode: "KODE",
        vilkårnavn: "Mistet arbeid",
        statuskode: "J",
        statusnavn: "Ja",
        erObligatorisk: true,
      },
    ]);

    render(<Vilkar vedtak={vedtak} />);

    expect(screen.getByText("Vilkår")).toBeInTheDocument();
    expect(screen.getByText("Mistet arbeid")).toBeInTheDocument();
  });

  it("rendrer uten feil når det ikke finnes vilkårsvurderinger", () => {
    const vedtak = lagVedtak([]);
    render(<Vilkar vedtak={vedtak} />);
    expect(screen.getByText("Vilkår")).toBeInTheDocument();
  });
});
