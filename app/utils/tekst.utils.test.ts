import { describe, expect, it } from "vitest";

import {
  formaterFaktaNok,
  formaterTilG,
  formaterTilNok,
  formaterTilProsent,
  jaNeiEllerBlank,
  storForbokstav,
  storForbokstavIHvertOrd,
  storForbokstavOgMellomromForUnderstrek,
} from "~/utils/tekst.utils";

describe("storForbokstav", () => {
  it("gjør første bokstav stor og resten liten", () => {
    expect(storForbokstav("HALLO")).toBe("Hallo");
  });
});

describe("storForbokstavIHvertOrd", () => {
  it("gjør første bokstav i hvert ord stor", () => {
    expect(storForbokstavIHvertOrd("kari NORDMANN")).toBe("Kari Nordmann");
  });

  it("returnerer tom streng for null/undefined/tom input", () => {
    expect(storForbokstavIHvertOrd(null)).toBe("");
    expect(storForbokstavIHvertOrd(undefined)).toBe("");
    expect(storForbokstavIHvertOrd("")).toBe("");
  });
});

describe("storForbokstavOgMellomromForUnderstrek", () => {
  it("erstatter understrek med mellomrom og stor forbokstav", () => {
    expect(storForbokstavOgMellomromForUnderstrek("AKTIV_SAK")).toBe("Aktiv sak");
  });
});

describe("formaterTilNok", () => {
  it("formaterer et heltall som NOK uten desimaler", () => {
    expect(formaterTilNok(1000)).toBe("1\u00A0000\u00A0kr");
  });

  it("returnerer tom streng for null/undefined", () => {
    expect(formaterTilNok(null)).toBe("");
    expect(formaterTilNok(undefined)).toBe("");
  });
});

describe("formaterTilG", () => {
  it("formaterer sum med G-suffiks og standard 3 desimaler", () => {
    expect(formaterTilG(1.5)).toBe("1,500 G");
  });

  it("respekterer antallDesimaler-opsjonen", () => {
    expect(formaterTilG(1.5, { antallDesimaler: 1 })).toBe("1,5 G");
  });
});

describe("formaterTilProsent", () => {
  it("legger til prosenttegn", () => {
    expect(formaterTilProsent(50)).toBe("50 %");
  });

  it("returnerer tom streng for null", () => {
    expect(formaterTilProsent(null)).toBe("");
  });
});

describe("formaterFaktaNok", () => {
  it("formaterer en numerisk streng som NOK", () => {
    expect(formaterFaktaNok("1000")).toBe("1\u00A0000\u00A0kr");
  });

  it("returnerer tankestrek for null/undefined/ikke-tall", () => {
    expect(formaterFaktaNok(null)).toBe("—");
    expect(formaterFaktaNok(undefined)).toBe("—");
    expect(formaterFaktaNok("abc")).toBe("—");
  });
});

describe("jaNeiEllerBlank", () => {
  it("mapper J/N til Ja/Nei", () => {
    expect(jaNeiEllerBlank("J")).toBe("Ja");
    expect(jaNeiEllerBlank("N")).toBe("Nei");
  });

  it("returnerer tankestrek for andre verdier", () => {
    expect(jaNeiEllerBlank(null)).toBe("—");
    expect(jaNeiEllerBlank(undefined)).toBe("—");
    expect(jaNeiEllerBlank("X")).toBe("—");
  });
});
