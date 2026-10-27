import {beforeEach, describe, expect, it, vi} from "vitest";
import {handleActions} from "~/features/handle-actions";
import {hentMigreringDatagrunnlag, migrerSak} from "~/features/sak/clients/migrer-sak-client.server";
import {unleash} from "~/utils/unleash.server";
import type {components} from "../../../openapi/arena-migrering-typer";

vi.mock("~/features/sak/clients/migrer-sak-client.server", () => ({
    hentMigreringDatagrunnlag: vi.fn(),
    migrerSak: vi.fn(),
}));
vi.mock("~/utils/unleash.server", () => ({
    unleash: {isEnabled: vi.fn()},
}));
vi.mock("~/components/person-sok/sok-person-action", () => ({
    sokPersonAction: vi.fn(),
}));

const grunnlag: components["schemas"]["StartMigrering"] = {
    sakId: 123,
    initiertAv: "test-saksbehandler",
    ident: "00000000000",
    innvilgetFraOgMed: "2026-01-01",
    innvilgetTilOgMed: "2026-12-31",
    opplysninger: [{
        uuid: "00000000-0000-4000-8000-000000000001",
        verdi: 42,
        gyldigFraOgMed: "2026-02-01",
    }],
};

function sendSkjema(innsendtGrunnlag: unknown = grunnlag) {
    const formData = new FormData();
    formData.set("_action", "migrer-sak");
    formData.set("grunnlag", typeof innsendtGrunnlag === "string"
        ? innsendtGrunnlag
        : JSON.stringify(innsendtGrunnlag));
    const request = new Request("http://localhost/person/456/saker/123/start-migrering", {
        method: "POST",
        body: formData,
    });
    return {request, result: handleActions(request, {sakId: "123", personId: "456"})};
}

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(unleash.isEnabled).mockReturnValue(true);
    vi.mocked(migrerSak).mockResolvedValue(null);
});

describe("migrer-sak", () => {
    it("sender innsendte verdier uten å hente grunnlaget på nytt", async () => {
        const innsendtGrunnlag = {
            ...grunnlag,
            opplysninger: grunnlag.opplysninger.map((opplysning) => ({...opplysning, verdi: 99})),
        };
        const {request, result} = sendSkjema(innsendtGrunnlag);
        const response = await result;

        expect(hentMigreringDatagrunnlag).not.toHaveBeenCalled();
        expect(migrerSak).toHaveBeenCalledExactlyOnceWith(request, innsendtGrunnlag);
        expect(response).toBeInstanceOf(Response);
        if (response instanceof Response) {
            expect(response.status).toBe(302);
            expect(response.headers.get("Location")).toBe("/person/456/saker/123");
        }
    });

    it.each([false, 0, ""])("beholder innsendt verdi %j", async (verdi) => {
        const innsendtGrunnlag = {
            ...grunnlag,
            opplysninger: grunnlag.opplysninger.map((opplysning) => ({...opplysning, verdi})),
        };
        const {request, result} = sendSkjema(innsendtGrunnlag);
        await result;

        expect(migrerSak).toHaveBeenCalledExactlyOnceWith(request, innsendtGrunnlag);
    });

    it.each([
        ["ugyldig JSON", "{"],
        ["manglende felter", {}],
        ["null", null],
        ["annen sak", {...grunnlag, sakId: 999}],
        ["ugyldig ident", {...grunnlag, ident: "ugyldig"}],
        ["ugyldig dato", {...grunnlag, innvilgetFraOgMed: "2026-02-30"}],
        ["ugyldig opplysning", {...grunnlag, opplysninger: [{uuid: "ugyldig"}]}],
    ])("avviser %s uten å starte migrering", async (_beskrivelse, innsendtGrunnlag) => {
        await expect(sendSkjema(innsendtGrunnlag).result).rejects.toMatchObject({status: 400});
        expect(migrerSak).not.toHaveBeenCalled();
    });

    it("avviser manglende grunnlag", async () => {
        const formData = new FormData();
        formData.set("_action", "migrer-sak");
        const request = new Request("http://localhost/", {method: "POST", body: formData});

        await expect(handleActions(request, {sakId: "123", personId: "456"}))
            .rejects.toMatchObject({status: 400});
        expect(migrerSak).not.toHaveBeenCalled();
    });

    it("avviser innsending når migrering er deaktivert", async () => {
        vi.mocked(unleash.isEnabled).mockReturnValue(false);

        await expect(sendSkjema().result).rejects.toMatchObject({status: 403});

        expect(unleash.isEnabled).toHaveBeenCalledWith("dp-migrering.start-migrering");
        expect(migrerSak).not.toHaveBeenCalled();
    });

    it("videresender feil fra migreringskallet uten omdirigering", async () => {
        const error = new Response("Kunne ikke starte migrering", {status: 502});
        vi.mocked(migrerSak).mockRejectedValue(error);

        await expect(sendSkjema().result).rejects.toBe(error);
    });
});
