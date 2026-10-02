import type { components } from "../../openapi/arena-sak-innsyn-typer";

export const mockPersonIdResponse: components["schemas"]["PersonIdResponse"] = {
  id: 123456,
};

export const mockArenaPerson: components["schemas"]["ArenaPersonResponse"] = {
  personId: 123456,
  fodselsnummer: "12345678910",
  fornavn: "Kari",
  etternavn: "Nordmann",
};

export const mockArenaSaker: components["schemas"]["ArenaSakResponse"][] = [
  {
    sakId: "SAK-1",
    opprettetAar: "2024",
    lopenr: 1,
    statuskode: "AKTIV",
    statusnavn: "Aktiv",
    registrertDato: "2024-01-15T00:00:00",
  },
];

export const mockArenaSakDetaljer: components["schemas"]["ArenaSakDetaljerResponse"] = {
  sakId: "SAK-1",
  opprettetAar: "2024",
  lopenr: 1,
  person: mockArenaPerson,
  statuskode: "AKTIV",
  statusnavn: "Aktiv",
  registrertDato: "2024-01-15T00:00:00",
  vedtak: [],
  kvoteHistorikk: [],
};

export const mockHttpProblem: components["schemas"]["HttpProblem"] = {
  type: "https://example.com/problems/not-found",
  title: "Fant ikke ressurs",
  status: 404,
  detail: "Ressursen finnes ikke",
};
