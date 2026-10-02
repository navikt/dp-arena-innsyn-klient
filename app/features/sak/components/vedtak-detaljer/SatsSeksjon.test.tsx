// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { SatsSeksjon } from "~/features/sak/components/vedtak-detaljer/SatsSeksjon";
import { formaterFaktaNok } from "~/utils/tekst.utils";
import type { components } from "../../../../../openapi/arena-sak-innsyn-typer";

function lagFakta(kode: string, verdi: string): components["schemas"]["ArenaVedtakfaktaResponse"] {
  return { kode, navn: kode, verdi, registrertDato: "2024-01-01" };
}

function tilFaktaMap(
  fakta: components["schemas"]["ArenaVedtakfaktaResponse"][],
): Map<string, components["schemas"]["ArenaVedtakfaktaResponse"]> {
  return new Map(fakta.map((f) => [f.kode, f]));
}

// testing-library sin getByText normaliserer mellomrom i DOM-teksten (nbsp -> vanlig space)
// før sammenligning, men normaliserer ikke selve søkestrengen. Bygg forventet verdi med
// samme formateringsfunksjon som komponenten bruker, og normaliser mellomrom på samme måte.
const enTusenKr = formaterFaktaNok("1000").replace(/\u00A0/g, " ");

describe("SatsSeksjon", () => {
  it("viser formaterte satsverdier", () => {
    const faktaMap = tilFaktaMap([lagFakta("DAGSFSAM", "1000"), lagFakta("BARNMSTON", "2")]);

    render(<SatsSeksjon faktaMap={faktaMap} relatertFaktaMap={null} />);

    expect(screen.getByText("Sats")).toBeInTheDocument();
    expect(screen.getByText(enTusenKr)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("viser tankestrek når fakta mangler", () => {
    render(<SatsSeksjon faktaMap={new Map()} relatertFaktaMap={null} />);

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("markerer felt som endret når verdien avviker fra relatert vedtak", () => {
    const faktaMap = tilFaktaMap([lagFakta("DAGSFSAM", "1000")]);
    const relatertFaktaMap = tilFaktaMap([lagFakta("DAGSFSAM", "900")]);

    render(<SatsSeksjon faktaMap={faktaMap} relatertFaktaMap={relatertFaktaMap} />);

    const verdiWrapper = screen.getByText(enTusenKr).parentElement;
    expect(verdiWrapper?.className).not.toBe("");
  });

  it("markerer ikke felt som endret når verdien er lik det relaterte vedtaket", () => {
    const faktaMap = tilFaktaMap([lagFakta("DAGSFSAM", "1000")]);
    const relatertFaktaMap = tilFaktaMap([lagFakta("DAGSFSAM", "1000")]);

    render(<SatsSeksjon faktaMap={faktaMap} relatertFaktaMap={relatertFaktaMap} />);

    const verdiWrapper = screen.getByText(enTusenKr).parentElement;
    expect(verdiWrapper?.className).toBe("");
  });
});

