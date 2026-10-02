import { afterEach, describe, expect, it, vi } from "vitest";
import { getToken, parseAzureUserToken, validateToken } from "@navikt/oasis";

import { getSaksbehandler } from "~/features/layout/clients/auth.server";
import { getMicrosoftOboToken } from "~/utils/auth.utils.server";
import { mockSaksbehandler } from "../../../../mocks/data/mock-saksbehandler";

vi.mock("@navikt/oasis", () => ({
  getToken: vi.fn(),
  validateToken: vi.fn(),
  parseAzureUserToken: vi.fn(),
}));

vi.mock("~/utils/auth.utils.server", () => ({
  getMicrosoftOboToken: vi.fn(),
}));

vi.mock("~/utils/logger.utils", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const originalEnv = { ...process.env };
const request = new Request("https://localhost/");

function mockGraphResponse(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(body),
    }),
  );
}

describe("getSaksbehandler", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("returnerer mock-saksbehandler uten å kalle Graph når IS_LOCALHOST er true", async () => {
    process.env.IS_LOCALHOST = "true";
    mockGraphResponse({});

    const saksbehandler = await getSaksbehandler(request);

    expect(saksbehandler).toEqual(mockSaksbehandler);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("kaster 401 Response når NAV-ident mangler (ingen token på requesten)", async () => {
    process.env.IS_LOCALHOST = "false";
    vi.mocked(getToken).mockReturnValue(null);

    await expect(getSaksbehandler(request)).rejects.toMatchObject({ status: 401 });
    expect(getMicrosoftOboToken).not.toHaveBeenCalled();
  });

  it("kaster 401 Response når token ikke validerer", async () => {
    process.env.IS_LOCALHOST = "false";
    vi.mocked(getToken).mockReturnValue("token");
    vi.mocked(validateToken).mockResolvedValue({
      ok: false,
      error: new Error("expired"),
      errorType: "token expired",
    });

    await expect(getSaksbehandler(request)).rejects.toMatchObject({ status: 401 });
  });

  it("kaster 401 Response når NAVident mangler i parsed token", async () => {
    process.env.IS_LOCALHOST = "false";
    vi.mocked(getToken).mockReturnValue("token");
    vi.mocked(validateToken).mockResolvedValue({ ok: true, payload: {} as never });
    vi.mocked(parseAzureUserToken).mockReturnValue({ ok: false, error: new Error("mangler claim") });

    await expect(getSaksbehandler(request)).rejects.toMatchObject({ status: 401 });
  });

  it("henter saksbehandler fra Graph med OBO-token og cacher resultatet på NAV-ident", async () => {
    process.env.IS_LOCALHOST = "false";
    vi.mocked(getToken).mockReturnValue("token");
    vi.mocked(validateToken).mockResolvedValue({ ok: true, payload: {} as never });
    vi.mocked(parseAzureUserToken).mockReturnValue({
      ok: true,
      NAVident: "Z999999",
      oid: "oid",
      name: "navn",
      preferred_username: "bruker",
    });
    vi.mocked(getMicrosoftOboToken).mockResolvedValue("obo-token");
    mockGraphResponse(mockSaksbehandler);

    const first = await getSaksbehandler(request);
    expect(first).toEqual(mockSaksbehandler);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Andre kall med samme NAV-ident skal hente fra cache, ikke kalle Graph på nytt.
    const second = await getSaksbehandler(request);
    expect(second).toEqual(mockSaksbehandler);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("kaster 401 Response når kall mot Graph feiler", async () => {
    process.env.IS_LOCALHOST = "false";
    vi.mocked(getToken).mockReturnValue("token");
    vi.mocked(validateToken).mockResolvedValue({ ok: true, payload: {} as never });
    vi.mocked(parseAzureUserToken).mockReturnValue({
      ok: true,
      NAVident: "Z888888",
      oid: "oid",
      name: "navn",
      preferred_username: "bruker",
    });
    vi.mocked(getMicrosoftOboToken).mockResolvedValue("obo-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("nettverksfeil")),
    );

    await expect(getSaksbehandler(request)).rejects.toMatchObject({ status: 401 });
  });
});
