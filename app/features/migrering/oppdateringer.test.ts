import {beforeEach, describe, expect, it, vi} from "vitest";
import {RouterContextProvider} from "react-router";
import {loader} from "~/features/migrering/oppdateringer";
import {hentMigreringsstrom} from "~/features/migrering/clients/migrering-oppdateringer.server";

vi.mock("~/features/migrering/clients/migrering-oppdateringer.server", () => ({
    hentMigreringsstrom: vi.fn(),
}));

const migreringId = "11111111-1111-4111-8111-111111111111";
const backendstrom = 'id: 42\ndata: {"id":42,"hendelse":"MIGRERING_STARTET","initiertAv":"syntetisk-ident"}\n\n';

function kallLoader(query = "", headers?: HeadersInit, id = migreringId, signal?: AbortSignal) {
    const url = new URL(`http://localhost/api/migrering/${id}/oppdateringer${query}`);
    return loader({
        request: new Request(url, {headers, signal}),
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

    it("avslutter en strom med klientavbrudd uten lesefeil", async () => {
        const abortController = new AbortController();
        const backend = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.enqueue(new TextEncoder().encode(backendstrom));
                abortController.signal.addEventListener("abort", () => {
                    controller.error(abortController.signal.reason);
                }, {once: true});
            },
        });
        vi.mocked(hentMigreringsstrom).mockResolvedValue(
            new Response(backend, {headers: {"Content-Type": "text/event-stream"}}),
        );

        const response = await kallLoader("", undefined, migreringId, abortController.signal);
        const reader = response.body!.getReader();
        expect(new TextDecoder().decode((await reader.read()).value)).toBe(backendstrom);
        const neste = reader.read();
        abortController.abort();

        await expect(neste).resolves.toMatchObject({done: true});
        expect(backend.locked).toBe(false);
    });

    it("videresender backendfeil selv om klienten har avbrutt", async () => {
        const abortController = new AbortController();
        const feil = new TypeError("Forbindelsen ble brutt");
        const backend = new ReadableStream<Uint8Array>({
            start(controller) {
                abortController.signal.addEventListener("abort", () => controller.error(feil), {once: true});
            },
        });
        vi.mocked(hentMigreringsstrom).mockResolvedValue(
            new Response(backend, {headers: {"Content-Type": "text/event-stream"}}),
        );

        const response = await kallLoader("", undefined, migreringId, abortController.signal);
        const lesing = response.text();
        abortController.abort();

        await expect(lesing).rejects.toBe(feil);
        expect(backend.locked).toBe(false);
    });

    it("videresender AbortError uten klientavbrudd", async () => {
        const feil = new DOMException("Backend avbrutt", "AbortError");
        const backend = new ReadableStream<Uint8Array>({
            start(controller) {
                controller.error(feil);
            },
        });
        vi.mocked(hentMigreringsstrom).mockResolvedValue(
            new Response(backend, {headers: {"Content-Type": "text/event-stream"}}),
        );

        const response = await kallLoader();
        await expect(response.text()).rejects.toBe(feil);
        expect(backend.locked).toBe(false);
    });

    it("kansellerer backend og frigir leseren ved kansellering under lesing", async () => {
        const cancel = vi.fn();
        const backend = new ReadableStream<Uint8Array>({cancel});
        vi.mocked(hentMigreringsstrom).mockResolvedValue(
            new Response(backend, {headers: {"Content-Type": "text/event-stream"}}),
        );

        const response = await kallLoader();
        const reader = response.body!.getReader();
        const lesing = reader.read();
        await reader.cancel("Klienten lukket forbindelsen");

        await expect(lesing).resolves.toMatchObject({done: true});
        expect(cancel).toHaveBeenCalledWith("Klienten lukket forbindelsen");
        expect(backend.locked).toBe(false);
    });

    it("beholder reelle feil ved kansellering", async () => {
        const feil = new TypeError("Kunne ikke kansellere backend");
        const backend = new ReadableStream<Uint8Array>({
            cancel() {
                throw feil;
            },
        });
        vi.mocked(hentMigreringsstrom).mockResolvedValue(
            new Response(backend, {headers: {"Content-Type": "text/event-stream"}}),
        );

        const response = await kallLoader();
        await expect(response.body!.cancel()).rejects.toBe(feil);
        expect(backend.locked).toBe(false);
    });

    it("returnerer klientavbrudd hvis forbindelsen lukkes for backend svarer", async () => {
        const abortController = new AbortController();
        vi.mocked(hentMigreringsstrom).mockImplementation(async (request) => {
            abortController.abort();
            throw request.signal.reason;
        });

        const response = await kallLoader("", undefined, migreringId, abortController.signal);
        expect(response.status).toBe(499);
        expect(response.body).toBeNull();
    });

    it("videresender feil for backend svarer uten klientavbrudd", async () => {
        const feil = new TypeError("Backend er utilgjengelig");
        vi.mocked(hentMigreringsstrom).mockRejectedValue(feil);
        await expect(kallLoader()).rejects.toBe(feil);
    });
});
