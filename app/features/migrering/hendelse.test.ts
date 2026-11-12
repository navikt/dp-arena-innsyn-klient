import {RouterContextProvider} from "react-router";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {loader} from "~/features/migrering/hendelse";
import {hentHendelse} from "~/features/migrering/clients/hendelse-client.server";

vi.mock("~/features/migrering/clients/hendelse-client.server", () => ({
    hentHendelse: vi.fn(),
}));

const hendelse = {
    id: 42,
    sakId: 123,
    initiertAv: "syntetisk-ident",
    hendelse: "MIGRERING_STARTET",
    data: "Detaljinnhold",
    opprinnelse: "Intern",
    tidspunkt: "2026-11-11T12:00:00",
};

function kallLoader(hendelseId?: string) {
    const url = new URL(`http://localhost/api/migrering/hendelse/${hendelseId ?? ""}`);
    return loader({
        request: new Request(url),
        url,
        pattern: "/api/migrering/hendelse/:hendelseId",
        params: {hendelseId},
        context: new RouterContextProvider(),
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(hentHendelse).mockResolvedValue(hendelse);
});

describe("hendelse loader", () => {
    it("returnerer hendelsen og forhindrer HTTP-caching", async () => {
        const response = await kallLoader("42");

        expect(hentHendelse).toHaveBeenCalledWith(expect.any(Request), 42);
        expect(response.data).toEqual({hendelse, feil: null});
        expect(new Headers(response.init?.headers).get("Cache-Control")).toBe("no-store");
    });

    it.each([undefined, "", "abc", "0", "-1", "1.5", "9007199254740992"])(
        "avviser ugyldig hendelses-ID %j uten backendkall",
        async (id) => {
            const response = await kallLoader(id);

            expect(response.init?.status).toBe(400);
            expect(response.data).toEqual({hendelse: null, feil: "Ugyldig hendelses-ID."});
            expect(new Headers(response.init?.headers).get("Cache-Control")).toBe("no-store");
            expect(hentHendelse).not.toHaveBeenCalled();
        },
    );

    it.each([401, 403, 500, 502])("returnerer API-feil %i uten backendens feiltekst", async (status) => {
        vi.mocked(hentHendelse).mockRejectedValue(new Response("sensitiv-feiltekst", {status}));

        const response = await kallLoader("42");
        expect(response.init?.status).toBe(status);
        expect(response.data.hendelse).toBeNull();
        expect(response.data.feil).toBeTruthy();
        expect(JSON.stringify(response.data)).not.toContain("sensitiv-feiltekst");
        expect(new Headers(response.init?.headers).get("Cache-Control")).toBe("no-store");
    });

    it("videresender uventede feil", async () => {
        const feil = new Error("Uventet feil");
        vi.mocked(hentHendelse).mockRejectedValue(feil);
        await expect(kallLoader("42")).rejects.toBe(feil);
    });
});
