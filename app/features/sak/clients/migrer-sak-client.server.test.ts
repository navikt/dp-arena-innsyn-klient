import {beforeEach, describe, expect, it, vi} from "vitest";
import {migrerSak} from "./migrer-sak-client.server";
import {arenaMigreringClient} from "~/utils/client.utils.server";
import type {components} from "../../../../openapi/arena-migrering-typer";

vi.mock("~/utils/auth.utils.server", () => ({
    getSaksbehandlingOboToken: vi.fn().mockResolvedValue("test-token"),
}));
vi.mock("~/utils/client.utils.server", () => ({
    arenaMigreringClient: {POST: vi.fn()},
}));

const request = new Request("http://localhost/");
const grunnlag: components["schemas"]["StartMigrering"] = {
    sakId: 123,
    initiertAv: "test-saksbehandler",
    ident: "syntetisk-ident",
    innvilgetFraOgMed: "2026-01-01",
    opplysninger: [],
};

beforeEach(() => vi.clearAllMocks());

describe("migrerSak", () => {
    it("godtar 202 Accepted uten responsinnhold", async () => {
        vi.mocked(arenaMigreringClient.POST).mockResolvedValue({
            response: new Response(null, {status: 202}),
            data: undefined,
        });

        await expect(migrerSak(request, grunnlag)).resolves.toBeNull();
        expect(arenaMigreringClient.POST).toHaveBeenCalledWith("/arena/migrering/sak/{sakId}", {
            headers: expect.objectContaining({"Content-Type": "application/json"}),
            params: {path: {sakId: "123"}},
            body: grunnlag,
        });
    });

    it("videresender HTTP-problemer fra migreringen", async () => {
        vi.mocked(arenaMigreringClient.POST).mockResolvedValue({
            response: new Response(null, {status: 409}),
            error: {type: "about:blank", title: "Konflikt", status: 409},
        });

        await expect(migrerSak(request, grunnlag)).rejects.toMatchObject({status: 409});
    });

    it("avviser uventede svar", async () => {
        vi.mocked(arenaMigreringClient.POST).mockResolvedValue({
            response: new Response(null, {status: 200}),
            data: undefined,
        });

        await expect(migrerSak(request, grunnlag)).rejects.toThrow("Uhåndtert feil ved migrering. 200");
    });
});
