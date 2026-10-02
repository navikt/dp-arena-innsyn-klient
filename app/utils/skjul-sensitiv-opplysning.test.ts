import { describe, expect, it } from "vitest";

import { maskerVerdi } from "~/utils/skjul-sensitiv-opplysning";

describe("maskerVerdi", () => {
  it("erstatter alle ikke-whitespace-tegn med stjerner", () => {
    expect(maskerVerdi("12345678910")).toBe("***********");
  });

  it("beholder mellomrom uendret", () => {
    expect(maskerVerdi("Kari Nordmann")).toBe("**** ********");
  });

  it("håndterer tall som input", () => {
    expect(maskerVerdi(123)).toBe("***");
  });
});
