import { describe, expect, it } from "vitest";

import { isAlert, isDefined } from "~/utils/type-guards";

describe("isAlert", () => {
  it("godtar en gyldig alert med alle felter", () => {
    expect(
      isAlert({ variant: "error", title: "Feil", body: "Noe gikk galt", service: "sak-api" }),
    ).toBe(true);
  });

  it("godtar en gyldig alert uten valgfrie felter", () => {
    expect(isAlert({ variant: "info", title: "Info" })).toBe(true);
  });

  it("avviser null og ikke-objekter", () => {
    expect(isAlert(null)).toBe(false);
    expect(isAlert("streng")).toBe(false);
    expect(isAlert(42)).toBe(false);
  });

  it("avviser ugyldig variant", () => {
    expect(isAlert({ variant: "ukjent", title: "Feil" })).toBe(false);
  });

  it("avviser manglende eller tom title", () => {
    expect(isAlert({ variant: "error" })).toBe(false);
    expect(isAlert({ variant: "error", title: "" })).toBe(false);
  });

  it("avviser body/service med feil type", () => {
    expect(isAlert({ variant: "error", title: "Feil", body: 123 })).toBe(false);
    expect(isAlert({ variant: "error", title: "Feil", service: 123 })).toBe(false);
  });
});

describe("isDefined", () => {
  it("returnerer true for definerte verdier, inkludert falsy", () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined("")).toBe(true);
    expect(isDefined(false)).toBe(true);
  });

  it("returnerer false for null/undefined", () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});
