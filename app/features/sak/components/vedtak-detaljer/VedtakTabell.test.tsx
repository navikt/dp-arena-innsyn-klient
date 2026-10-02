// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { VedtakTabell } from "~/features/sak/components/vedtak-detaljer/VedtakTabell";
import type { components } from "../../../../../openapi/arena-sak-innsyn-typer";

function lagVedtak(
  overrides: Partial<components["schemas"]["ArenaVedtakMedDetaljerResponse"]>,
): components["schemas"]["ArenaVedtakMedDetaljerResponse"] {
  return {
    lopenrvedtak: 1,
    fakta: [],
    vilkårsvurderinger: [],
    ...overrides,
  };
}

describe("VedtakTabell", () => {
  it("viser melding om ingen vedtak når listen er tom", () => {
    render(<VedtakTabell vedtak={[]} />);

    expect(screen.getByText("Vedtak på saken (0)")).toBeInTheDocument();
    expect(screen.getByText("Det er ingen vedtak på saken")).toBeInTheDocument();
  });

  it("viser antall og rader for vedtak, sortert synkende på løpenummer", () => {
    const vedtak = [
      lagVedtak({ vedtakId: 1, lopenrvedtak: 1, rettighetnavn: "Ordinære dagpenger" }),
      lagVedtak({ vedtakId: 2, lopenrvedtak: 2, rettighetnavn: "Dagpenger ved permittering" }),
    ];

    render(<VedtakTabell vedtak={vedtak} />);

    expect(screen.getByText("Vedtak på saken (2)")).toBeInTheDocument();

    const rows = screen.getAllByRole("row").slice(1); // hopp over header-raden
    expect(rows[0]).toHaveTextContent("Dagpenger ved permittering");
    expect(rows[1]).toHaveTextContent("Ordinære dagpenger");
  });

  it("viser Ja/Nei-ikon basert på utfallkode, og tankestrek når utfall mangler", () => {
    const vedtak = [
      lagVedtak({ vedtakId: 1, lopenrvedtak: 1, utfallkode: "Ja" }),
      lagVedtak({ vedtakId: 2, lopenrvedtak: 2, utfallkode: "Nei" }),
      lagVedtak({ vedtakId: 3, lopenrvedtak: 3, utfallkode: null }),
    ];

    render(<VedtakTabell vedtak={vedtak} />);

    expect(screen.getByText("Ja")).toBeInTheDocument();
    expect(screen.getByText("Nei")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
