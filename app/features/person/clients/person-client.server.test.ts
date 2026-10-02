import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";

import { mockArena } from "../../../../mocks/mock-arena";
import { mockArenaPerson, mockHttpProblem, mockPersonIdResponse } from "../../../../mocks/data/mock-arena";

vi.mock("~/utils/auth.utils.server", () => ({
  getSaksbehandlingOboToken: vi.fn().mockResolvedValue("obo-token"),
}));

const server = setupServer(...mockArena);

// server.listen() må kjøre FØR client.utils.server.ts importeres: openapi-fetch
// fanger `globalThis.fetch` én gang i createClient() (default-parameter `baseFetch = globalThis.fetch`),
// så hvis klienten opprettes før MSW har patchet fetch, går alle kall mot ekte nettverk
// resten av testfilens levetid — uavhengig av handlers/overrides.
server.listen({ onUnhandledRequest: "error" });

// DP_MIGRERING_URL må være satt FØR client.utils.server.ts importeres (baseUrl bygges ved modul-last),
// så vi stubber env og importerer modulene på nytt i denne testfilen.
vi.stubEnv("DP_MIGRERING_URL", "http://localhost:8080");
const { sokPerson, hentPerson } = await import("./person-client.server");

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const request = new Request("https://localhost/");

describe("sokPerson", () => {
  it("returnerer personId fra Arena ved treff", async () => {
    const result = await sokPerson(request, "12345678910");
    expect(result).toEqual(mockPersonIdResponse);
  });

  it("kaster feil med riktig status/tittel når Arena returnerer et problem", async () => {
    server.use(
      http.post("*/arena/innsyn/person", () =>
        HttpResponse.json(mockHttpProblem, { status: mockHttpProblem.status }),
      ),
    );

    await expect(sokPerson(request, "ukjent")).rejects.toMatchObject({
      status: mockHttpProblem.status,
      statusText: mockHttpProblem.detail,
    });
  });
});

describe("hentPerson", () => {
  it("returnerer personinformasjon fra Arena", async () => {
    const result = await hentPerson(request, 123456);
    expect(result).toEqual(mockArenaPerson);
  });

  it("kaster feil når personen ikke finnes", async () => {
    server.use(
      http.get("*/arena/innsyn/person/:personId", () =>
        HttpResponse.json(mockHttpProblem, { status: mockHttpProblem.status }),
      ),
    );

    await expect(hentPerson(request, 999)).rejects.toMatchObject({
      status: mockHttpProblem.status,
    });
  });
});
