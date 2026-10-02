import { describe, expect, it } from "vitest";

import { hentValideringForPersonIdent } from "~/utils/validering.util";

describe("hentValideringForPersonIdent", () => {
  const schema = hentValideringForPersonIdent();

  it("godtar et 11-sifret fødselsnummer", () => {
    const result = schema.safeParse({ personIdent: "12345678910" });
    expect(result.success).toBe(true);
  });

  it("feiler når fødselsnummeret inneholder bokstaver", () => {
    const result = schema.safeParse({ personIdent: "1234567891a" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Fødselsnummer kan kun inneholde tall");
    }
  });

  it("feiler når fødselsnummeret ikke er 11 siffer", () => {
    const result = schema.safeParse({ personIdent: "123" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Fødselsnummer må være 11 siffer");
    }
  });
});
