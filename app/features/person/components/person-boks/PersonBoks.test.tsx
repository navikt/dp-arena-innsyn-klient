// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PersonBoks } from "~/features/person/components/person-boks/PersonBoks";
import { SaksbehandlerContext } from "~/features/layout/context/saksbehandler-context";
import type { components } from "../../../../../openapi/arena-sak-innsyn-typer";

const person: components["schemas"]["ArenaPersonResponse"] = {
  personId: 1,
  fodselsnummer: "01010123456",
  fornavn: "Kari",
  etternavn: "Nordmann",
};

function renderMedSkjulSensitive(skjulSensitiveOpplysninger: boolean) {
  return render(
    <SaksbehandlerContext.Provider
      value={{
        aktivtOppgaveSok: "",
        setAktivtOppgaveSok: () => {},
        skjulSensitiveOpplysninger,
        setSkjulSensitiveOpplysninger: () => {},
        tema: "light",
        setTema: () => {},
      }}
    >
      <PersonBoks person={person} />
    </SaksbehandlerContext.Provider>,
  );
}

describe("PersonBoks", () => {
  it("viser navn og fødselsnummer i klartekst når sensitive opplysninger ikke er skjult", () => {
    renderMedSkjulSensitive(false);

    expect(screen.getByText("Kari Nordmann")).toBeInTheDocument();
    expect(screen.getByText(/010101 23456/)).toBeInTheDocument();
  });

  it("maskerer navn og fødselsnummer når sensitive opplysninger er skjult", () => {
    renderMedSkjulSensitive(true);

    expect(screen.queryByText("Kari Nordmann")).not.toBeInTheDocument();
    expect(screen.queryByText(/010101 23456/)).not.toBeInTheDocument();
    expect(screen.getByText("**** ********")).toBeInTheDocument();
    expect(screen.getByText(/\*{6} \*{5}/)).toBeInTheDocument();
  });

  it("viser riktig kjønnsikon basert på fødselsnummer", () => {
    renderMedSkjulSensitive(false);
    expect(screen.getByTitle("Kvinne")).toBeInTheDocument();
  });

  it("kaster feil uten en SaksbehandlerProvider", () => {
    expect(() => render(<PersonBoks person={person} />)).toThrow(
      /useSaksbehandler must be used within/,
    );
  });
});
