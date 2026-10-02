import {afterEach, describe, expect, it, vi} from "vitest";
import {getToken, requestOboToken, validateToken} from "@navikt/oasis";

import {getMicrosoftOboToken, getSaksbehandlingOboToken} from "~/utils/auth.utils.server";

vi.mock("@navikt/oasis", () => ({
    getToken: vi.fn(),
    requestOboToken: vi.fn(),
    validateToken: vi.fn(),
}));

vi.mock("~/utils/logger.utils", () => ({
    logger: {info: vi.fn(), warn: vi.fn(), error: vi.fn()},
}));

const request = new Request("https://localhost/");

describe("getSaksbehandlingOboToken", () => {
    const originalEnv = {...process.env};

    afterEach(() => {
        process.env = {...originalEnv};
        vi.clearAllMocks();
    });

    it("returnerer token fra env direkte når IS_LOCALHOST er true, uten å validere eller hente OBO-token", async () => {
        process.env.IS_LOCALHOST = "true";
        process.env.DP_SAKSBEHANDLING_TOKEN = "lokalt-token";

        const token = await getSaksbehandlingOboToken(request);

        expect(token).toBe("lokalt-token");
        expect(getToken).not.toHaveBeenCalled();
        expect(requestOboToken).not.toHaveBeenCalled();
    });

    it("kaster 401 Response når request mangler token", async () => {
        process.env.IS_LOCALHOST = "false";
        vi.mocked(getToken).mockReturnValue(null);

        await expect(getSaksbehandlingOboToken(request)).rejects.toMatchObject({
            status: 401,
        });
        expect(validateToken).not.toHaveBeenCalled();
    });

    it("kaster 401 Response når token ikke validerer", async () => {
        process.env.IS_LOCALHOST = "false";
        vi.mocked(getToken).mockReturnValue("ugyldig-token");
        vi.mocked(validateToken).mockResolvedValue({
            ok: false,
            error: new Error("expired"),
            errorType: "token expired",
        });

        await expect(getSaksbehandlingOboToken(request)).rejects.toMatchObject({
            status: 401,
        });
        expect(requestOboToken).not.toHaveBeenCalled();
    });

    it("kaster 401 Response når OBO-utveksling feiler", async () => {
        process.env.IS_LOCALHOST = "false";
        process.env.DP_MIGRERING_CLUSTER_NAME = "dev-fss";
        vi.mocked(getToken).mockReturnValue("gyldig-token");
        vi.mocked(validateToken).mockResolvedValue({
            ok: true,
            payload: {} as never,
        });
        vi.mocked(requestOboToken).mockResolvedValue({
            ok: false,
            error: new Error("azure nede"),
        });

        await expect(getSaksbehandlingOboToken(request)).rejects.toMatchObject({
            status: 401,
        });
    });

    it("returnerer OBO-token med riktig audience (dp-migrering) når alt validerer", async () => {
        process.env.IS_LOCALHOST = "false";
        process.env.DP_MIGRERING_CLUSTER_NAME = "dev-fss";
        vi.mocked(getToken).mockReturnValue("gyldig-token");
        vi.mocked(validateToken).mockResolvedValue({
            ok: true,
            payload: {} as never,
        });
        vi.mocked(requestOboToken).mockResolvedValue({ok: true, token: "obo-token"});

        const token = await getSaksbehandlingOboToken(request);

        expect(token).toBe("obo-token");
        expect(requestOboToken).toHaveBeenCalledWith(
            "gyldig-token",
            "api://dev-fss.teamdagpenger.dp-migrering/.default",
        );
    });
});

describe("getMicrosoftOboToken", () => {
    const originalEnv = {...process.env};

    afterEach(() => {
        process.env = {...originalEnv};
        vi.clearAllMocks();
    });

    it("returnerer token fra env direkte når IS_LOCALHOST er true", async () => {
        process.env.IS_LOCALHOST = "true";
        process.env.MICROSOFT_TOKEN = "lokalt-ms-token";

        const token = await getMicrosoftOboToken(request);

        expect(token).toBe("lokalt-ms-token");
        expect(getToken).not.toHaveBeenCalled();
    });

    it("ber om OBO-token med Graph-audience når ikke lokalt", async () => {
        process.env.IS_LOCALHOST = "false";
        vi.mocked(getToken).mockReturnValue("gyldig-token");
        vi.mocked(validateToken).mockResolvedValue({
            ok: true,
            payload: {} as never,
        });
        vi.mocked(requestOboToken).mockResolvedValue({ok: true, token: "ms-obo-token"});

        const token = await getMicrosoftOboToken(request);

        expect(token).toBe("ms-obo-token");
        expect(requestOboToken).toHaveBeenCalledWith(
            "gyldig-token",
            "https://graph.microsoft.com/.default",
        );
    });
});
