import { describe, expect, it } from "vitest";

import { fjernTusenskille, formaterBelopUnderInntasting, formaterTallMedTusenSeperator } from "~/utils/number.utils";

describe("formaterTallMedTusenSeperator", () => {
  it("formaterer et tall med tusenskilletegn", () => {
    expect(formaterTallMedTusenSeperator(1234567)).toBe("1\u00A0234\u00A0567");
  });

  describe("formaterBelopUnderInntasting", () => {
    it.each([
      ["", ""],
      ["-", "-"],
      ["0", "0"],
      ["1000", "1\u00a0000"],
      ["1234567", "1\u00a0234\u00a0567"],
      ["-1234567", "-1\u00a0234\u00a0567"],
      ["12345,", "12\u00a0345,"],
      ["12345,50", "12\u00a0345,50"],
      ["12345.50", "12\u00a0345,50"],
      ["-0,25", "-0,25"],
      [",", ","],
      [".5", ",5"],
      ["1 234 567,00", "1\u00a0234\u00a0567,00"],
      ["1\u202f234\u202f567", "1\u00a0234\u00a0567"],
      ["9007199254740993", "9\u00a0007\u00a0199\u00a0254\u00a0740\u00a0993"],
      ["1,2.3", "1,2.3"],
      ["abc", "abc"],
    ])("formaterer %j til %j uten å runde av eller miste desimaler", (verdi, forventet) => {
      expect(formaterBelopUnderInntasting(verdi)).toBe(forventet);
    });
  });

  describe("fjernTusenskille", () => {
    it.each(["1 234 567,50", "1\u00a0234\u00a0567,50", "1\u202f234\u202f567,50"])(
      "fjerner tusenskille fra %j",
      (verdi) => expect(fjernTusenskille(verdi)).toBe("1234567,50"),
    );
  });

  it("formaterer en numerisk streng", () => {
    expect(formaterTallMedTusenSeperator("1234567")).toBe("1\u00A0234\u00A0567");
  });

  it("returnerer NaN-formatering for ugyldig streng", () => {
    expect(formaterTallMedTusenSeperator("ikke-tall")).toBe("NaN");
  });
});
