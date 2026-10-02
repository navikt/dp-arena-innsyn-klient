import { delay, http, HttpResponse } from "msw";

import {
  mockArenaPerson,
  mockArenaSakDetaljer,
  mockArenaSaker,
  mockPersonIdResponse,
} from "./data/mock-arena";

// Matcher uansett host/origin, slik at handlerne fungerer uavhengig av DP_MIGRERING_URL.
export const mockArena = [
  // Søk opp personId for et fødselsnummer
  http.post("*/arena/innsyn/person", async () => {
    await delay();
    return HttpResponse.json(mockPersonIdResponse);
  }),

  // Hent personinformasjon
  http.get("*/arena/innsyn/person/:personId", async () => {
    await delay();
    return HttpResponse.json(mockArenaPerson);
  }),

  // Hent alle saker for en person
  http.get("*/arena/innsyn/sak/person/:personId", async () => {
    await delay();
    return HttpResponse.json(mockArenaSaker);
  }),

  // Hent detaljert informasjon om en sak
  http.get("*/arena/innsyn/sak/:sakid/detaljert", async () => {
    await delay();
    return HttpResponse.json(mockArenaSakDetaljer);
  }),
];
