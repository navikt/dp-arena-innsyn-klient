// @vitest-environment happy-dom

import {Accordion} from "@navikt/ds-react";
import {act, cleanup, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {createRoutesStub, data, type LoaderFunction, type LoaderFunctionArgs} from "react-router";
import {afterEach, describe, expect, it, vi} from "vitest";
import {Migreringshendelse} from "~/features/migrering/components/Migreringshendelse";
import type {components} from "../../../../openapi/arena-migrering-typer";
import type {Migreringshendelse as Hendelse} from "~/features/migrering/use-migreringshendelser";

const detaljer: components["schemas"]["MigreringHendelseResponse"] = {
    id: 42,
    sakId: 123,
    initiertAv: "syntetisk-ident",
    hendelse: "MIGRERING_STARTET",
    data: '{"beskrivelse":"Detaljinnhold"}',
    opprinnelse: "Intern",
    tidspunkt: "2026-11-11T12:00:00",
};

function visHendelser(
    loader: LoaderFunction,
    hendelser: Hendelse[] = [{id: 42, hendelse: "MIGRERING_STARTET"}],
) {
    const RoutesStub = createRoutesStub([
        {
            path: "/",
            Component: () => (
                <Accordion>
                    {hendelser.map((hendelse, index) => (
                        <Migreringshendelse key={index} hendelse={hendelse}/>
                    ))}
                </Accordion>
            ),
        },
        {path: "/api/migrering/hendelse/:hendelseId", loader},
    ]);
    return render(<RoutesStub initialEntries={["/"]}/>);
}

afterEach(cleanup);

async function apneRawMelding() {
    fireEvent.click(await screen.findByRole("button", {name: "Vis raw melding"}));
    return screen.getByRole("dialog", {name: "Raw melding"});
}

describe("Migreringshendelse", () => {
    it("henter detaljer ved forste apning og gjenbruker dem ved ny apning", async () => {
        const loader = vi.fn().mockReturnValue({hendelse: detaljer, feil: null});
        visHendelser(loader);
        const knapp = screen.getByRole("button", {name: "MIGRERING_STARTET"});
        expect(loader).not.toHaveBeenCalled();

        fireEvent.click(knapp);
        expect(within(await apneRawMelding()).getByText(/Detaljinnhold/)).toBeVisible();
        fireEvent.click(screen.getAllByRole("button", {name: "Lukk"})[1]);
        expect(loader).toHaveBeenCalledTimes(1);
        expect(loader.mock.calls[0][0].params.hendelseId).toBe("42");

        fireEvent.click(knapp);
        fireEvent.click(knapp);
        expect(within(await apneRawMelding()).getByText(/Detaljinnhold/)).toBeVisible();
        expect(loader).toHaveBeenCalledTimes(1);
    });

    it("viser lasting og unngar et nytt kall mens detaljer hentes", async () => {
        type Detaljresultat = {hendelse: typeof detaljer; feil: null};
        let resolve: (resultat: Detaljresultat) => void;
        const promise = new Promise<Detaljresultat>((fullfor) => {
            resolve = fullfor;
        });
        const loader = vi.fn().mockReturnValue(promise);
        visHendelser(loader);
        const knapp = screen.getByRole("button", {name: "MIGRERING_STARTET"});

        fireEvent.click(knapp);
        expect(await screen.findByRole("status")).toHaveTextContent("Henter hendelsen.");
        fireEvent.click(knapp);
        fireEvent.click(knapp);
        expect(loader).toHaveBeenCalledTimes(1);

        await act(async () => resolve({hendelse: detaljer, feil: null}));
        expect(within(await apneRawMelding()).getByText(/Detaljinnhold/)).toBeVisible();
    });

    it("viser API-feil i elementet og lar brukeren prove igjen", async () => {
        const loader = vi.fn()
            .mockReturnValueOnce(data(
                {hendelse: null, feil: "Du har ikke tilgang til hendelsen, eller den finnes ikke."},
                {status: 403},
            ))
            .mockReturnValueOnce({hendelse: detaljer, feil: null});
        visHendelser(loader);

        fireEvent.click(screen.getByRole("button", {name: "MIGRERING_STARTET"}));
        expect(await screen.findByRole("alert")).toHaveTextContent("Du har ikke tilgang");

        fireEvent.click(screen.getByRole("button", {name: "Prøv igjen"}));
        expect(within(await apneRawMelding()).getByText(/Detaljinnhold/)).toBeVisible();
        expect(loader).toHaveBeenCalledTimes(2);
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("holder detaljer for ulike hendelser adskilt", async () => {
        const loader = vi.fn(({params}: LoaderFunctionArgs) => ({
            hendelse: {
                ...detaljer,
                id: Number(params.hendelseId),
                data: JSON.stringify({beskrivelse: `Detaljer ${params.hendelseId}`}),
            },
            feil: null,
        }));
        visHendelser(loader, [
            {id: 42, hendelse: "FORSTE"},
            {id: 43, hendelse: "ANDRE"},
        ]);

        fireEvent.click(screen.getByRole("button", {name: "FORSTE"}));
        expect(within(await apneRawMelding()).getByText(/Detaljer 42/)).toBeVisible();
        fireEvent.click(screen.getAllByRole("button", {name: "Lukk"})[1]);
        expect(loader).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", {name: "ANDRE"}));
        await waitFor(() => expect(screen.getAllByRole("button", {name: "Vis raw melding"})).toHaveLength(2));
        const knapper = screen.getAllByRole("button", {name: "Vis raw melding"});
        fireEvent.click(knapper[1]);
        expect(within(screen.getByRole("dialog", {name: "Raw melding"})).getByText(/Detaljer 43/)).toBeVisible();
        expect(screen.getByText(/Detaljer 42/)).toBeInTheDocument();
        expect(loader).toHaveBeenCalledTimes(2);
    });

    it("viser manglende ID uten a kalle API-et", async () => {
        const loader = vi.fn();
        visHendelser(loader, [{hendelse: "UTEN_ID"}]);

        fireEvent.click(screen.getByRole("button", {name: "UTEN_ID"}));
        expect(screen.getByRole("alert")).toHaveTextContent("Hendelsen mangler en ID");
        expect(loader).not.toHaveBeenCalled();
    });

    it("viser detaljinnhold som tekst, ikke HTML", async () => {
        const loader = vi.fn().mockReturnValue({
            hendelse: {...detaljer, data: "<script>sensitivtInnhold()</script>"},
            feil: null,
        });
        const {container} = visHendelser(loader);

        fireEvent.click(screen.getByRole("button", {name: "MIGRERING_STARTET"}));
        expect(within(await apneRawMelding()).getByText("<script>sensitivtInnhold()</script>")).toBeVisible();
        expect(screen.getByRole("alert")).toHaveTextContent("Viser originalteksten.");
        expect(container.querySelector("script")).toBeNull();
    });

    it("viser JSON-lister i JSON-visningen", async () => {
        const loader = vi.fn().mockReturnValue({
            hendelse: {...detaljer, data: '[{"beskrivelse":"Listeinnhold"}]'},
            feil: null,
        });
        visHendelser(loader);

        fireEvent.click(screen.getByRole("button", {name: "MIGRERING_STARTET"}));
        expect(within(await apneRawMelding()).getByText(/Listeinnhold/)).toBeVisible();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it.each(["null", "42", '"tekst"'])("viser originaltekst og beskjed for JSON-verdien %s", async (tekst) => {
        const loader = vi.fn().mockReturnValue({
            hendelse: {...detaljer, data: tekst},
            feil: null,
        });
        visHendelser(loader);

        fireEvent.click(screen.getByRole("button", {name: "MIGRERING_STARTET"}));
        expect(await screen.findByRole("alert")).toHaveTextContent("Viser originalteksten.");
        expect(within(await apneRawMelding()).getByText(tekst)).toBeVisible();
    });

    it.each([
        {hendelse: "MIGRERING_STARTET_MED_MANGLENDE_OPPLYSNINGER", data: "{}"},
        {hendelse: "MIGRERING_STARTET_MED_MANGLENDE_OPPLYSNINGER", data: '{"manglendeOpplysninger":null,"opplysninger":[]}'},
        {hendelse: "MIGRERING_AVBRUTT", data: "{}"},
    ])("viser formatfeil uten a krasje for $hendelse med $data", async (innhold) => {
        const loader = vi.fn().mockReturnValue({
            hendelse: {...detaljer, ...innhold},
            feil: null,
        });
        visHendelser(loader);
        fireEvent.click(screen.getByRole("button", {name: "MIGRERING_STARTET"}));
        await screen.findByRole("button", {name: "Vis raw melding"});

    });

    it("viser manglende opplysninger fra hendelsesdata", async () => {
        const loader = vi.fn().mockReturnValue({
            hendelse: {
                ...detaljer,
                hendelse: "MIGRERING_STARTET_MED_MANGLENDE_OPPLYSNINGER",
                data: JSON.stringify({
                    manglendeOpplysninger: [{navn: "Eksempelopplysning", uuid: "opplysning-1"}],
                    opplysninger: [],
                }),
            },
            feil: null,
        });
        visHendelser(loader);
        fireEvent.click(screen.getByRole("button", {name: "MIGRERING_STARTET"}));
        await screen.findByRole("button", {name: "Vis raw melding"});

        fireEvent.click(screen.getByRole("button", {name: "Vis mer"}));
        expect(screen.getByText("Eksempelopplysning")).toBeVisible();
        expect(screen.getByText("opplysning-1")).toBeVisible();
        expect(screen.getByText("Ingen opplysninger")).toBeVisible();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("viser arsaken nar migreringen er avbrutt", async () => {
        const loader = vi.fn().mockReturnValue({
            hendelse: {
                ...detaljer,
                hendelse: "MIGRERING_AVBRUTT",
                data: JSON.stringify({årsak: {beskrivelse: "Mangler grunnlag"}}),
            },
            feil: null,
        });
        visHendelser(loader);
        fireEvent.click(screen.getByRole("button", {name: "MIGRERING_STARTET"}));
        await screen.findByRole("button", {name: "Vis raw melding"});

        fireEvent.click(screen.getByRole("button", {name: "Vis mer"}));
        expect(within(screen.getByRole("row", {name: /^Årsak/})).getByText(/Mangler grunnlag/)).toBeVisible();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
});
