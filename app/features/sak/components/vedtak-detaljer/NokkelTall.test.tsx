// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { Nokkeltall } from "~/features/sak/components/vedtak-detaljer/NokkelTall";
import { formaterTilNok } from "~/utils/tekst.utils";
import type { components } from "../../../../../openapi/arena-sak-innsyn-typer";

// testing-library sin getByText normaliserer mellomrom i DOM-teksten (nbsp -> vanlig space)
// før sammenligning, men normaliserer ikke selve søkestrengen.
const nok = (verdi: number) => formaterTilNok(verdi).replace(/\u00A0/g, " ");

function lagSak(
  vedtak: components["schemas"]["ArenaVedtakMedDetaljerResponse"][],
): components["schemas"]["ArenaSakDetaljerResponse"] {
  return {
    sakId: "SAK-1",
    opprettetAar: "2024",
    lopenr: 1,
    person: { personId: 1, fodselsnummer: "12345678910", fornavn: "Kari", etternavn: "Nordmann" },
    statuskode: "AKTIV",
    statusnavn: "Aktiv",
    registrertDato: "2024-01-15T00:00:00",
    vedtak,
    kvoteHistorikk: [],
  };
}

describe("Nokkeltall", () => {
  it("returnerer null når det ikke finnes vedtak", () => {
    const { container } = render(<Nokkeltall sak={lagSak([])} />);
    expect(container.firstChild).toBeNull();
  });

  it("viser nøkkeltall fra siste vedtak basert på fakta-koder", () => {
    const sak = lagSak([
      {
        lopenrvedtak: 1,
        fakta: [
          { kode: "DPBERDATO", navn: "Beregningstidspunkt", verdi: "15-01-2024", registrertDato: "2024-01-15" },
          { kode: "GRUNN", navn: "Grunnlag", verdi: "300000", registrertDato: "2024-01-15" },
          { kode: "DAGS", navn: "Dagsats", verdi: "1200", registrertDato: "2024-01-15" },
          { kode: "BARNTILL", navn: "Barnetillegg", verdi: "50", registrertDato: "2024-01-15" },
          { kode: "BARNMSTON", navn: "Antall barn", verdi: "2", registrertDato: "2024-01-15" },
        ],
        vilkårsvurderinger: [],
      },
    ]);

    render(<Nokkeltall sak={sak} />);

    expect(screen.getByText("Siste status beregningsgrunnlag")).toBeInTheDocument();
    expect(screen.getByText("15.01.2024")).toBeInTheDocument();
    expect(screen.getByText(nok(300000))).toBeInTheDocument();
    expect(screen.getByText(nok(1200))).toBeInTheDocument();
    expect(screen.getByText("Barnetillegg (2)")).toBeInTheDocument();
  });

  it("velger det siste vedtaket (høyest løpenummer)", () => {
    const sak = lagSak([
      {
        lopenrvedtak: 1,
        fakta: [{ kode: "DAGS", navn: "Dagsats", verdi: "100", registrertDato: "2024-01-01" }],
        vilkårsvurderinger: [],
      },
      {
        lopenrvedtak: 2,
        fakta: [{ kode: "DAGS", navn: "Dagsats", verdi: "200", registrertDato: "2024-02-01" }],
        vilkårsvurderinger: [],
      },
    ]);

    render(<Nokkeltall sak={sak} />);

    expect(screen.getByText(nok(200))).toBeInTheDocument();
    expect(screen.queryByText(nok(100))).not.toBeInTheDocument();
  });
});
