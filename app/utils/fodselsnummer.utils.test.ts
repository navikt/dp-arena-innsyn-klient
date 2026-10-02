import { describe, expect, it } from "vitest";

import { finnKjonnFraFodselsnummer } from "~/utils/fodselsnummer.utils";

describe("finnKjonnFraFodselsnummer", () => {
  it("returnerer UKJENT for ugyldig lengde", () => {
    expect(finnKjonnFraFodselsnummer("123")).toBe("UKJENT");
    expect(finnKjonnFraFodselsnummer("")).toBe("UKJENT");
  });

  it("returnerer UKJENT for fødselsnummer med ikke-tall", () => {
    expect(finnKjonnFraFodselsnummer("1234567890a")).toBe("UKJENT");
  });

  it("returnerer KVINNE når kjønnssifferet (9. siffer, index 8) er partall", () => {
    expect("01010123456".charAt(8)).toBe("4");
    expect(finnKjonnFraFodselsnummer("01010123456")).toBe("KVINNE");
  });

  it("returnerer MANN når kjønnssifferet (9. siffer, index 8) er oddetall", () => {
    expect("01010123356".charAt(8)).toBe("3");
    expect(finnKjonnFraFodselsnummer("01010123356")).toBe("MANN");
  });
});
