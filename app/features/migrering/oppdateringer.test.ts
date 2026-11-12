import {beforeEach, describe, expect, it, vi} from "vitest";
import {RouterContextProvider} from "react-router";
import {loader} from "~/features/migrering/oppdateringer";
import {hentMigreringsstrom} from "~/features/migrering/clients/migrering-oppdateringer.server";

vi.mock("~/features/migrering/clients/migrering-oppdateringer.server", () => ({
    hentMigreringsstrom: vi.fn(),
}));

const migreringId = "11111111-1111-4111-8111-111111111111";
const backendstrom = 'id: 42\ndata: {"id":42,"hendelse":"MIGRERING_STARTET","initiertAv":"syntetisk-ident"}\n\n';

function kallLoader(query = "", headers?: HeadersInit, id = migreringId) {
    const url = new URL(`http://localhost/api/migrering/${id}/oppdateringer${query}`);
    return loader({
        request: new Request(url, {headers}),
        url,
        pattern: "/api/migrering/:migreringId/oppdateringer",
        params: {migreringId: id},
        context: new RouterContextProvider(),
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hentMigreringsstrom).mockResolvedValue(
        new Response(backendstrom, {
            headers: {"Content-Type": "text/event-stream; charset=utf-8"},
        }),
    );
});

describe("migrering oppdateringer loader", () => {
    it("videresender backendstrommen urort og setter streaming-headere", async () => {
        const response = await kallLoader();
        expect(response.headers.get("Content-Type")).toBe("text/event-stream");
        expect(response.headers.get("Cache-Control")).toBe("no-cache, no-transform");
        expect(response.headers.get("X-Accel-Buffering")).toBe("no");
        await expect(response.text()).resolves.toBe(backendstrom);
    });

    it("videresender since som cursor", async () => {
        const response = await kallLoader("?since=42");
        expect(hentMigreringsstrom).toHaveBeenCalledWith(expect.any(Request), migreringId, "42");
        await response.body?.cancel();
    });

    it("gir Last-Event-ID forrang over since", async () => {
        const response = await kallLoader("?since=41", {"Last-Event-ID": "42"});
        expect(hentMigreringsstrom).toHaveBeenCalledWith(expect.any(Request), migreringId, "42");
        await response.body?.cancel();
    });

    it.each(["-1", "NaN", "1.5", ""])("avviser ugyldig cursor %j", async (cursor) => {
        await expect(kallLoader(`?since=${cursor}`)).rejects.toMatchObject({status: 400});
        expect(hentMigreringsstrom).not.toHaveBeenCalled();
    });

    it("avviser ugyldig migrerings-ID", async () => {
        await expect(kallLoader("", undefined, "ugyldig")).rejects.toMatchObject({status: 400});
        expect(hentMigreringsstrom).not.toHaveBeenCalled();
    });

    it("beholder tilgangsfeil fra backend", async () => {
        const backendrespons = new Response("Ingen tilgang", {status: 403});
        vi.mocked(hentMigreringsstrom).mockResolvedValue(backendrespons);
        await expect(kallLoader()).resolves.toBe(backendrespons);
    });

    it("avviser et vellykket svar som ikke er en SSE-strom", async () => {
        vi.mocked(hentMigreringsstrom).mockResolvedValue(
            new Response("{}", {headers: {"Content-Type": "application/json"}}),
        );
        await expect(kallLoader()).rejects.toMatchObject({status: 502});
    });
});
