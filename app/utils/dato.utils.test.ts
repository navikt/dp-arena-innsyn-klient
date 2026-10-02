import { describe, expect, it } from "vitest";

import {
  formaterFaktaDato,
  formaterTilNorskDato,
  norsktDatoformat,
  norsktDatoformatMedTid,
  parseFaktaDato,
  pickDate,
} from "~/utils/dato.utils";

describe("formaterTilNorskDato", () => {
  it("formaterer en Date-instans uten klokkeslett", () => {
    expect(formaterTilNorskDato(new Date("2021-01-31T12:00:00"))).toBe("31.01.2021");
  });

  it("formaterer en ISO-streng med klokkeslett", () => {
    expect(formaterTilNorskDato("2021-01-31T12:30:45", true)).toBe("31.01.2021 - 12:30:45");
  });

  it("kaster feil for ugyldig datoformat", () => {
    expect(() => formaterTilNorskDato("ikke-en-dato")).toThrow(/Ugyldig datoformat/);
  });
});

describe("pickDate", () => {
  it("filtrerer bort null/undefined og velger tidligste dato (asc)", () => {
    const result = pickDate(["15-03-2024", null, "01-01-2024", undefined, "20-06-2024"], "asc");
    expect(result).toEqual(parseFaktaDato("01-01-2024"));
  });

  it("velger seneste dato (desc)", () => {
    const result = pickDate(["15-03-2024", "01-01-2024", "20-06-2024"], "desc");
    expect(result).toEqual(parseFaktaDato("20-06-2024"));
  });

  it("returnerer undefined for tom liste", () => {
    expect(pickDate([], "asc")).toBeUndefined();
  });
});

describe("norsktDatoformat", () => {
  it("returnerer tankestrek for null/undefined", () => {
    expect(norsktDatoformat(null)).toBe("—");
    expect(norsktDatoformat(undefined)).toBe("—");
  });

  it("formaterer en gyldig dato", () => {
    expect(norsktDatoformat(new Date("2024-06-15T00:00:00"))).toBe("15.06.2024");
  });
});

describe("norsktDatoformatMedTid", () => {
  it("formaterer dato med klokkeslett", () => {
    expect(norsktDatoformatMedTid("2024-06-15T13:45:00")).toBe("15.06.2024 13:45:00");
  });
});

describe("parseFaktaDato", () => {
  it("returnerer null for null/undefined", () => {
    expect(parseFaktaDato(null)).toBeNull();
    expect(parseFaktaDato(undefined)).toBeNull();
  });

  it("parser dd-MM-yyyy til Date", () => {
    const result = parseFaktaDato("01-02-2024");
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1); // februar = index 1
    expect(result.getDate()).toBe(1);
  });
});

describe("formaterFaktaDato", () => {
  it("returnerer null når input er null/undefined", () => {
    expect(formaterFaktaDato(null)).toBeNull();
    expect(formaterFaktaDato(undefined)).toBeNull();
  });

  it("formaterer en fakta-dato til norsk format", () => {
    expect(formaterFaktaDato("01-02-2024")).toBe("01.02.2024");
  });
});
