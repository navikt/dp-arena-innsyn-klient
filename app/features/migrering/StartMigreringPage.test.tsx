// @vitest-environment happy-dom

import {cleanup, render, screen, within} from "@testing-library/react";
import {createRoutesStub, useActionData} from "react-router";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import StartMigreringPage from "~/features/migrering/StartMigreringPage";
import {useMigreringshendelser} from "~/features/migrering/use-migreringshendelser";
import type {StartMigreringResponse} from "~/features/sak/clients/migrer-sak-client.server";

vi.mock("react-router", async (importOriginal) => {
    const original = await importOriginal<typeof import("react-router")>();
    return {...original, useActionData: vi.fn()};
});
vi.mock("~/features/handle-actions", () => ({
    handleActions: vi.fn(),
}));
vi.mock("~/features/migrering/use-migreringshendelser", () => ({
    useMigreringshendelser: vi.fn(),
}));

const migreringResponse: StartMigreringResponse = {
    sakId: 123,
    migreringId: "migrering-1",
    initiertAv: "saksbehandler",
    ident: "syntetisk-ident",
    simulering: false,
    migreringsTidspunkt: "2026-11-12",
};

async function visSide() {
    const RoutesStub = createRoutesStub([{
        path: "/migrering/:sakId",
        Component: StartMigreringPage,
        loader: () => ({sakId: "123"}),
    }]);
    const visning = render(<RoutesStub initialEntries={["/migrering/123"]}/>);
    await screen.findByRole("heading", {name: "Migrer sak 123"});
    return visning;
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useActionData).mockReturnValue(undefined);
    vi.mocked(useMigreringshendelser).mockReturnValue({
        connected: false,
        hendelser: [],
        feil: null,
    });
});

afterEach(cleanup);

describe("StartMigreringPage", () => {
    it("starter ikke lytting for action har returnert en migrerings-ID", async () => {
        await visSide();
        expect(useMigreringshendelser).toHaveBeenCalledWith(undefined);
        expect(screen.queryByRole("region", {name: "Hendelser"})).not.toBeInTheDocument();
    });

    it("sender migrerings-ID fra action til hooken", async () => {
        vi.mocked(useActionData).mockReturnValue(migreringResponse);
        await visSide();

        expect(useMigreringshendelser).toHaveBeenCalledWith("migrering-1");
        expect(screen.getByText("Ingen hendelser mottatt ennå.")).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Start migrering"})).toBeDisabled();
        expect(screen.getByRole("checkbox", {name: "Simuler migrering"})).toBeDisabled();
    });

    it("viser hendelsesnavnet i accordion og forbindelsesstatus", async () => {
        vi.mocked(useActionData).mockReturnValue(migreringResponse);
        vi.mocked(useMigreringshendelser).mockReturnValue({
            connected: true,
            hendelser: [{
                id: 42,
                hendelse: "MIGRERING_STARTET",
                tidspunkt: "2026-11-11T12:00:00",
                initiertAv: "syntetisk-ident",
                opprinnelse: "Intern",
            }],
            feil: null,
        });
        await visSide();

        expect(screen.getByRole("status")).toHaveTextContent("Lytter etter hendelser.");
        const region = screen.getByRole("region", {name: "Hendelser"});
        expect(within(region).getByRole("button", {name: "MIGRERING_STARTET"})).toBeInTheDocument();
        expect(screen.queryByText("syntetisk-ident")).not.toBeInTheDocument();
    });

    it("viser feil fra hendelsesstrommen", async () => {
        vi.mocked(useActionData).mockReturnValue(migreringResponse);
        vi.mocked(useMigreringshendelser).mockReturnValue({
            connected: false,
            hendelser: [],
            feil: "Kunne ikke åpne hendelsesstrømmen.",
        });
        await visSide();

        expect(screen.getByRole("alert")).toHaveTextContent("Kunne ikke åpne hendelsesstrømmen.");
    });

    it("lar skjemaet forbli aktivt etter en valideringsfeil", async () => {
        vi.mocked(useActionData).mockReturnValue({fieldErrors: {migreringsTidspunkt: "Ugyldig dato"}});
        await visSide();

        expect(useMigreringshendelser).toHaveBeenCalledWith(undefined);
        expect(screen.getByRole("button", {name: "Start migrering"})).toBeEnabled();
        expect(screen.queryByRole("region", {name: "Hendelser"})).not.toBeInTheDocument();
    });
});
