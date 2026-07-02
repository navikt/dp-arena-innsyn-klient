import { expect, test } from "vitest";

import { components } from "@/openapi/behandling-typer";

import {
  erOpplysningsperiodeInnenforRettighetsperiode,
  erPrøvingsdatoInnenforPeriode,
} from "./opplysning.utils";

const testcases = [
  {
    tittel: "Uendelig opplysningsperiode er innenfor rettighetsperiode",
    rettighetsperiode: rettighetsperiode("2000-01-01", undefined),
    opplysningsperiode: opplysningsperiode(undefined, undefined),
    forventet: true,
  },
  {
    tittel:
      "Uendelig opplysningsperiode er innenfor tullete rettighetsperiode (for opplysningsperioden er uendelig anyways)",
    rettighetsperiode: rettighetsperiode("hello", "world"),
    opplysningsperiode: opplysningsperiode(undefined, undefined),
    forventet: true,
  },
  {
    tittel: "Opplysningsperiode og rettighetsperiode med samme start er innenfor",
    rettighetsperiode: rettighetsperiode("2000-01-01", undefined),
    opplysningsperiode: opplysningsperiode("2000-01-01", undefined),
    forventet: true,
  },
  {
    tittel: "Opplysningsperiode med start dagen før rettighetsperiodens start er utenfor",
    rettighetsperiode: rettighetsperiode("2000-01-01", undefined),
    opplysningsperiode: opplysningsperiode("1999-12-31", undefined),
    forventet: false,
  },
  {
    tittel: "Opplysningsperiode med start dagen etter rettighetsperiodens start er innenfor",
    rettighetsperiode: rettighetsperiode("2000-01-01", undefined),
    opplysningsperiode: opplysningsperiode("2000-01-02", undefined),
    forventet: true,
  },
  {
    tittel: "Definert opplysningsperiode er innenfor definert rettighetsperiode",
    rettighetsperiode: rettighetsperiode("2000-01-01", "2000-12-31"),
    opplysningsperiode: opplysningsperiode("2000-02-01", "2000-11-30"),
    forventet: true,
  },
  {
    tittel: "Definert opplysningsperiode er utenfor definert rettighetsperiode",
    rettighetsperiode: rettighetsperiode("2000-01-01", "2000-12-31"),
    opplysningsperiode: opplysningsperiode("2000-12-31", "2001-01-01"),
    forventet: false,
  },
];

const prøvingsdatoTestcases = [
  {
    tittel: "Prøvingsdato innenfor rettighetsperiode",
    opplysningsperiode: opplysningsperiode("2000-01-01", "2000-12-31"),
    prøvingsdato: "2000-01-01",
  },
];

function rettighetsperiode(fom: string, tom?: string): components["schemas"]["Rettighetsperiode"] {
  return {
    fraOgMed: fom,
    tilOgMed: tom,
    harRett: false,
  };
}

function opplysningsperiode(
  fom?: string,
  tom?: string,
): components["schemas"]["Opplysningsperiode"] {
  return {
    gyldigFraOgMed: fom,
    gyldigTilOgMed: tom,
    opprinnelse: "Ny",
    id: "",
    opprettet: "",
    verdi: {
      verdi: "",
      datatype: "inntekt",
    },
  };
}

testcases.forEach(({ tittel, rettighetsperiode, opplysningsperiode, forventet }) => {
  test(tittel, () => {
    const resultat = erOpplysningsperiodeInnenforRettighetsperiode(
      rettighetsperiode,
      opplysningsperiode,
    );
    expect(resultat).toBe(forventet);
  });
});

prøvingsdatoTestcases.forEach(({ tittel, opplysningsperiode, prøvingsdato }) => {
  test(tittel, () => {
    const resultat = erPrøvingsdatoInnenforPeriode(
      prøvingsdato,
      opplysningsperiode.gyldigFraOgMed,
      opplysningsperiode.gyldigTilOgMed,
    );
    expect(resultat).toBe(true);
  });
});
