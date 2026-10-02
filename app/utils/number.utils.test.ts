import { describe, expect, it } from "vitest";

import { formaterTallMedTusenSeperator } from "~/utils/number.utils";

describe("formaterTallMedTusenSeperator", () => {
  it("formaterer et tall med tusenskilletegn", () => {
    expect(formaterTallMedTusenSeperator(1234567)).toBe("1\u00A0234\u00A0567");
  });

  it("formaterer en numerisk streng", () => {
    expect(formaterTallMedTusenSeperator("1234567")).toBe("1\u00A0234\u00A0567");
  });

  it("returnerer NaN-formatering for ugyldig streng", () => {
    expect(formaterTallMedTusenSeperator("ikke-tall")).toBe("NaN");
  });
});
