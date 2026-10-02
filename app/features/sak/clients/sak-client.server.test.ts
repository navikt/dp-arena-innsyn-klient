import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";

import { mockArena } from "../../../../mocks/mock-arena";
import { mockArenaSakDetaljer, mockArenaSaker, mockHttpProblem } from "../../../../mocks/data/mock-arena";

vi.mock("~/utils/auth.utils.server", () => ({
  getSaksbehandlingOboToken: vi.fn().mockResolvedValue("obo-token"),
}));

const server = setupServer(...mockArena);

// server.listen() må kjøre FØR client.utils.server.ts importeres: openapi-fetch
// fanger `globalThis.fetch` én gang i createClient() (default-parameter `baseFetch = globalThis.fetch`),
// så hvis klienten opprettes før MSW har patchet fetch, går alle kall mot ekte nettverk
// resten av testfilens levetid — uavhengig av handlers/overrides.
server.listen({ onUnhandledRequest: "error" });

vi.stubEnv("DP_MIGRERING_URL", "http://localhost:8080");
const { hentSakForPerson, hentSakerForPerson } = await import("./sak-client.server");

afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const request = new Request("https://localhost/");

describe("hentSakerForPerson", () => {
  it("returnerer saker for personen", async () => {
    const result = await hentSakerForPerson(request, 123456);
    expect(result).toEqual(mockArenaSaker);
  });

  it("kaster feil med riktig status når Arena returnerer et problem", async () => {
    server.use(
      http.get("*/arena/innsyn/sak/person/:personId", () =>
        HttpResponse.json(mockHttpProblem, { status: mockHttpProblem.status }),
      ),
    );

    await expect(hentSakerForPerson(request, 999)).rejects.toMatchObject({
      status: mockHttpProblem.status,
      statusText: mockHttpProblem.detail,
    });
  });
});

describe("hentSakForPerson", () => {
  it("returnerer detaljert sak", async () => {
    const result = await hentSakForPerson(request, "SAK-1");
    expect(result).toEqual(mockArenaSakDetaljer);
  });

  it("kaster feil når saken ikke finnes", async () => {
    server.use(
      http.get("*/arena/innsyn/sak/:sakid/detaljert", () =>
        HttpResponse.json(mockHttpProblem, { status: mockHttpProblem.status }),
      ),
    );

    await expect(hentSakForPerson(request, "ukjent-sak")).rejects.toMatchObject({
      status: mockHttpProblem.status,
    });
  });
});
