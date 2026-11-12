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
const sakId = "123";
const grunnlag: components["schemas"]["StartMigreringRequest"] = {
    simulering: false,
    migreringsTidspunkt: "2026-01-01",
};
const migrering: components["schemas"]["StartMigreringResponse"] = {
    sakId: 123,
    initiertAv: "test-saksbehandler",
    ident: "syntetisk-ident",
    migreringId: "00000000-0000-0000-0000-000000000000",
    simulering: false,
};

beforeEach(() => vi.clearAllMocks());

describe("migrerSak", () => {
    it("returnerer migreringssvaret ved 201 Created", async () => {
        vi.mocked(arenaMigreringClient.POST).mockResolvedValue({
            response: new Response(null, {status: 201}),
            data: migrering,
        });

        await expect(migrerSak(sakId, request, grunnlag)).resolves.toEqual(migrering);
        expect(arenaMigreringClient.POST).toHaveBeenCalledWith("/arena/migrering/sak/{sakId}", {
            headers: expect.objectContaining({"Content-Type": "application/json"}),
            params: {path: {sakId}},
            body: grunnlag,
        });
    });

    it("videresender HTTP-problemer fra migreringen", async () => {
        vi.mocked(arenaMigreringClient.POST).mockResolvedValue({
            response: new Response(null, {status: 409}),
            error: {type: "about:blank", title: "Konflikt", status: 409},
        });

        await expect(migrerSak(sakId, request, grunnlag)).rejects.toMatchObject({status: 409});
    });

    it("avviser uventede svar", async () => {
        vi.mocked(arenaMigreringClient.POST).mockResolvedValue({
            response: new Response(null, {status: 200}),
            data: migrering,
        });

        await expect(migrerSak(sakId, request, grunnlag))
            .rejects.toThrow("Uhåndtert feil ved migrering. 200");
    });
});
