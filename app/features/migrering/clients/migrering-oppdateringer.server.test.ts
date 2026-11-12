import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {hentMigreringsstrom} from "~/features/migrering/clients/migrering-oppdateringer.server";
import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";

vi.mock("~/utils/auth.utils.server", () => ({
    getSaksbehandlingOboToken: vi.fn().mockResolvedValue("syntetisk-token"),
}));
vi.mock("~/utils/env.utils", () => ({
    getEnv: vi.fn().mockReturnValue("https://migrering.example/"),
}));

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue(new Response("data: {}\n\n"));
});

afterEach(() => vi.unstubAllGlobals());

describe("hentMigreringsstrom", () => {
    it("returnerer en urort respons med OBO-token og avbruddssignal", async () => {
        const request = new Request("http://localhost/");
        const response = await hentMigreringsstrom(request, "migrering/1");

        expect(getSaksbehandlingOboToken).toHaveBeenCalledWith(request);
        expect(fetchMock).toHaveBeenCalledWith(
            "https://migrering.example/arena/migrering/migrering%2F1/oppdateringer",
            expect.objectContaining({signal: request.signal, cache: "no-store"}),
        );
        const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
        expect(headers.get("Authorization")).toBe("Bearer syntetisk-token");
        expect(headers.get("Accept")).toBe("text/event-stream");
        expect(headers.has("Last-Event-ID")).toBe(false);
        expect(response.bodyUsed).toBe(false);
    });

    it("sender cursor i Last-Event-ID til backend", async () => {
        await hentMigreringsstrom(new Request("http://localhost/"), "migrering-1", "42");
        const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
        expect(headers.get("Last-Event-ID")).toBe("42");
    });

    it("stopper dersom tokenutvekslingen avvises", async () => {
        const feil = new Response("Ingen tilgang", {status: 403});
        vi.mocked(getSaksbehandlingOboToken).mockRejectedValueOnce(feil);

        await expect(hentMigreringsstrom(new Request("http://localhost/"), "migrering-1"))
            .rejects.toBe(feil);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("videresender nettverksfeil", async () => {
        const feil = new TypeError("Forbindelsen ble brutt");
        fetchMock.mockRejectedValueOnce(feil);

        await expect(hentMigreringsstrom(new Request("http://localhost/"), "migrering-1"))
            .rejects.toBe(feil);
    });
});
