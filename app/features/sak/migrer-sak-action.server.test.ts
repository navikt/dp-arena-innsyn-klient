import {beforeEach, describe, expect, it, vi} from "vitest";
import {migrerSakAction} from "~/features/sak/migrer-sak-action.server";
import {migrerSak} from "~/features/sak/clients/migrer-sak-client.server";
import {unleash} from "~/utils/unleash.server";
import type {components} from "../../../openapi/arena-migrering-typer";

vi.mock("~/features/sak/clients/migrer-sak-client.server", () => ({
    migrerSak: vi.fn(),
}));
vi.mock("~/utils/unleash.server", () => ({
    unleash: {isEnabled: vi.fn()},
}));
vi.mock("~/components/person-sok/sok-person-action", () => ({
    sokPersonAction: vi.fn(),
}));

const grunnlag: components["schemas"]["StartMigreringRequest"] = {
    simulering: false,
    migreringsTidspunkt: "2026-01-01",
};

const migrering: components["schemas"]["StartMigreringResponse"] = {
    sakId: 123,
    migreringId: "00000000-0000-0000-0000-000000000000",
    simulering: false,
    initiertAv: "test-saksbehandler",
    ident: "syntetisk-ident",
};

function sendSkjema({
    migreringsTidspunkt,
    simulering,
}: {
    migreringsTidspunkt?: string;
    simulering?: string;
} = {
    migreringsTidspunkt: grunnlag.migreringsTidspunkt,
    simulering: String(grunnlag.simulering),
}) {
    const formData = new FormData();
    if (migreringsTidspunkt !== undefined) {
        formData.set("migreringsTidspunkt", migreringsTidspunkt);
    }
    if (simulering !== undefined) {
        formData.set("simulering", simulering);
    }
    const request = new Request("http://localhost/person/456/saker/123/start-migrering", {method: "POST"});
    return {request, formData};
}

beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(unleash.isEnabled).mockReturnValue(true);
    vi.mocked(migrerSak).mockResolvedValue(migrering);
});

describe("migrer-sak", () => {
    it("sender sakId og migreringsgrunnlag til klienten", async () => {
        const {request, formData} = sendSkjema();

        await expect(migrerSakAction(request, "123", formData)).resolves.toEqual(migrering);
        expect(migrerSak).toHaveBeenCalledWith("123", request, grunnlag);
    });

    it("sender simulering og migreringsTidspunkt fra skjemaet", async () => {
        const migreringsTidspunkt = "2026-03-15";
        const {request, formData} = sendSkjema({migreringsTidspunkt, simulering: "true"});

        await migrerSakAction(request, "123", formData);

        expect(migrerSak).toHaveBeenCalledWith("123", request, {
            migreringsTidspunkt,
            simulering: true,
        });
    });

    it.each([undefined, "", "ikke-en-dato", "2026-02-30", "2026-01-01T12:00:00"])(
        "avviser ugyldig migreringsTidspunkt %s med 400",
        async (migreringsTidspunkt) => {
            const {request, formData} = sendSkjema({migreringsTidspunkt});

            await expect(migrerSakAction(request, "123", formData))
                .rejects.toMatchObject({status: 400});
            expect(migrerSak).not.toHaveBeenCalled();
        },
    );

    it("sender simulering false nar avkrysningsboksen ikke er valgt", async () => {
        const {request, formData} = sendSkjema({migreringsTidspunkt: "2026-03-15"});

        await migrerSakAction(request, "123", formData);

        expect(migrerSak).toHaveBeenCalledWith("123", request, {
            migreringsTidspunkt: "2026-03-15",
            simulering: false,
        });
    });

    it("avviser når migrering er deaktivert med 403", async () => {
        vi.mocked(unleash.isEnabled).mockReturnValue(false);
        const {request, formData} = sendSkjema();

        await expect(migrerSakAction(request, "123", formData))
            .rejects.toMatchObject({status: 403});
        expect(migrerSak).not.toHaveBeenCalled();
    });

    it("videresender backendfeil", async () => {
        const backendFeil = new Response("Backendfeil", {status: 502});
        vi.mocked(migrerSak).mockRejectedValue(backendFeil);
        const {request, formData} = sendSkjema();

        await expect(migrerSakAction(request, "123", formData))
            .rejects.toBe(backendFeil);
    });
});
