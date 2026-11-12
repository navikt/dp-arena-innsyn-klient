import {beforeEach, describe, expect, it, vi} from "vitest";
import type {FetchResponse} from "openapi-fetch";
import type {components, paths} from "../../../../openapi/arena-migrering-typer";
import {hentHendelse} from "~/features/migrering/clients/hendelse-client.server";
import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {logger} from "~/utils/logger.utils";

type HendelseResultat = FetchResponse<
    paths["/arena/migrering/hendelse/{hendelseId}"]["get"],
    {parseAs: "json"},
    `${string}/${string}`
>;
const {getMock} = vi.hoisted(() => ({
    getMock: vi.fn<() => Promise<HendelseResultat>>(),
}));

vi.mock("~/utils/auth.utils.server", () => ({
    getSaksbehandlingOboToken: vi.fn().mockResolvedValue("syntetisk-token"),
}));
vi.mock("~/utils/client.utils.server", () => ({
    arenaMigreringClient: {GET: getMock},
}));
vi.mock("~/utils/logger.utils", () => ({
    logger: {error: vi.fn()},
}));

const hendelse: components["schemas"]["MigreringHendelseResponse"] = {
    id: 42,
    sakId: 123,
    initiertAv: "syntetisk-ident",
    hendelse: "MIGRERING_STARTET",
    data: "Detaljinnhold",
    opprinnelse: "Intern",
    tidspunkt: "2026-11-11T12:00:00",
};

beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue({
        data: hendelse,
        response: new Response(null, {status: 200}),
    });
});

describe("hentHendelse", () => {
    it("henter en hendelse med OBO-token og uten caching", async () => {
        const request = new Request("http://localhost/");

        await expect(hentHendelse(request, 42)).resolves.toEqual(hendelse);
        expect(getSaksbehandlingOboToken).toHaveBeenCalledWith(request);
        expect(getMock).toHaveBeenCalledWith("/arena/migrering/hendelse/{hendelseId}", {
            headers: expect.objectContaining({Authorization: "Bearer syntetisk-token"}),
            params: {path: {hendelseId: 42}},
            signal: request.signal,
            cache: "no-store",
        });
        expect(logger.error).not.toHaveBeenCalled();
    });

    it("beholder feilstatus uten a logge backendens feilinnhold", async () => {
        getMock.mockResolvedValue({
            response: new Response(null, {status: 403}),
            error: {
                type: "about:blank",
                status: 403,
                title: "sensitiv-tittel",
                detail: "sensitiv-feildetalj",
            },
        });

        await expect(hentHendelse(new Request("http://localhost/"), 42))
            .rejects.toMatchObject({status: 403});
        expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("403"));
        expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain("sensitiv-");
    });

    it("avviser uventede vellykkede statuskoder", async () => {
        getMock.mockResolvedValue({
            data: hendelse,
            response: new Response(null, {status: 201}),
        });

        await expect(hentHendelse(new Request("http://localhost/"), 42))
            .rejects.toMatchObject({status: 502});
    });

    it("stopper dersom tokenutvekslingen avvises", async () => {
        const feil = new Response(null, {status: 401});
        vi.mocked(getSaksbehandlingOboToken).mockRejectedValueOnce(feil);

        await expect(hentHendelse(new Request("http://localhost/"), 42)).rejects.toBe(feil);
        expect(getMock).not.toHaveBeenCalled();
    });
});
