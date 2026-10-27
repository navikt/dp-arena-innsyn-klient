// @vitest-environment happy-dom
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {cleanup, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import {createMemoryRouter, RouterProvider} from "react-router";
import StartMigreringDialog from "./StartMigreringDialog";
import type {components} from "../../../openapi/arena-migrering-typer";

type Opplysningstype = components["schemas"]["MigreringGrunnlagOpplysningVerdi"]["type"];

vi.mock("~/utils/unleash.server", () => ({
    unleash: {isEnabled: vi.fn()},
}));
vi.mock("~/features/sak/clients/migrer-sak-client.server", () => ({
    hentMigreringDatagrunnlag: vi.fn(),
}));
vi.mock("~/features/handle-actions", () => ({
    handleActions: vi.fn(),
}));

const datagrunnlag: components["schemas"]["MigreringGrunnlag"] = {
    sakId: 123,
    initiertAv: "test-saksbehandler",
    ident: "00000000000",
    innvilgetFraOgMed: "2026-01-01",
    opplysninger: [
        {uuid: "tekst", navn: "Tekst", verdi: {type: "string", verdi: "verdi"}, gyldigFraOgMed: "2026-02-01"},
        {uuid: "boolsk", navn: "Boolsk", verdi: {type: "boolean", verdi: false}, gyldigFraOgMed: "2026-03-01"},
        {uuid: "heltall", navn: "Heltall", verdi: {type: "integer", verdi: 0}, gyldigFraOgMed: "2026-04-01"},
        {uuid: "desimaltall", navn: "Desimaltall", verdi: {type: "float", verdi: 12.5}, gyldigFraOgMed: "2026-05-01"},
        {uuid: "dato", navn: "Dato", verdi: {type: "date", verdi: "2026-06-01"}, gyldigFraOgMed: "2026-06-01"},
        {uuid: "tom-tekst", navn: "Tom tekst", verdi: {type: "string", verdi: ""}, gyldigFraOgMed: "2026-07-01"},
        {uuid: "uten-verdi", navn: "Uten verdi", gyldigFraOgMed: "2026-01-01"},
    ],
};

function visDialog(kanStarteMigrering = true, grunnlag: unknown = datagrunnlag) {
    const innsendt = vi.fn();
    const router = createMemoryRouter([
        {
            path: "/person/:personId/saker/:sakId/start-migrering",
            Component: StartMigreringDialog,
            loader: () => ({datagrunnlag: grunnlag, sakId: "123", personId: "456", kanStarteMigrering}),
            action: async ({request}) => {
                innsendt(await request.formData());
                return null;
            },
            HydrateFallback: () => null,
        },
        {path: "/person/:personId/saker/:sakId", element: <div>Sak</div>},
    ], {initialEntries: ["/person/456/saker/123/start-migrering"]});
    render(<RouterProvider router={router}/>);
    return {innsendt, router};
}

function visTomOpplysning(type: Opplysningstype, gyldigFraOgMed?: string) {
    return visDialog(true, {
        ...datagrunnlag,
        opplysninger: [{
            uuid: "ny-opplysning",
            navn: "Ny opplysning",
            verdi: {type, verdi: null},
            gyldigFraOgMed,
        }],
    });
}

beforeEach(() => vi.setSystemTime(new Date(2026, 9, 27, 0, 30)));
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

describe("StartMigreringDialog", () => {
    it.each<Opplysningstype>(["integer", "float"])("formaterer %s med tusenskille og sender et tall", async (type) => {
        const {innsendt, router} = visTomOpplysning(type, "2026-08-01");
        const felt = await screen.findByRole("textbox", {name: "Ny opplysning"});
        fireEvent.change(felt, {target: {value: "1234567"}});

        expect(felt).toHaveValue("1\u00a0234\u00a0567");
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([{
            uuid: "ny-opplysning",
            verdi: 1234567,
            gyldigFraOgMed: "2026-08-01",
        }]);
        router.dispose();
    });

    it("beholder desimaltegnet og avsluttende nuller mens brukeren skriver", async () => {
        const {innsendt, router} = visTomOpplysning("float", "2026-08-01");
        const felt = await screen.findByRole("textbox", {name: "Ny opplysning"});
        for (const verdi of ["1", "12", "123", "1234", "1\u00a0234,", "1\u00a0234,5", "1\u00a0234,50"]) {
            fireEvent.change(felt, {target: {value: verdi}});
        }

        expect(felt).toHaveValue("1\u00a0234,50");
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger[0].verdi).toBe(1234.5);
        router.dispose();
    });

    it("beholder markørposisjonen når brukeren redigerer midt i beløpet", async () => {
        const {router} = visTomOpplysning("integer", "2026-08-01");
        const felt = await screen.findByRole<HTMLInputElement>("textbox", {name: "Ny opplysning"});
        felt.focus();
        fireEvent.change(felt, {target: {value: "123456"}});
        expect(felt).toHaveValue("123\u00a0456");

        fireEvent.change(felt, {
            target: {value: "1293\u00a0456", selectionStart: 3, selectionEnd: 3},
        });

        expect(felt).toHaveValue("1\u00a0293\u00a0456");
        expect(felt.selectionStart).toBe(4);
        expect(felt.selectionEnd).toBe(4);
        router.dispose();
    });

    it("lar backspace slette sifferet foran et tusenskille", async () => {
        const {router} = visTomOpplysning("integer", "2026-08-01");
        const felt = await screen.findByRole<HTMLInputElement>("textbox", {name: "Ny opplysning"});
        felt.focus();
        fireEvent.change(felt, {target: {value: "12345"}});
        felt.setSelectionRange(3, 3);

        fireEvent.keyDown(felt, {key: "Backspace"});
        expect(felt.selectionStart).toBe(2);
        fireEvent.change(felt, {target: {value: "1\u00a0345", selectionStart: 1, selectionEnd: 1}});

        expect(felt).toHaveValue("1\u00a0345");
        expect(felt.selectionStart).toBe(1);
        router.dispose();
    });

    it("lar delete slette sifferet etter et tusenskille", async () => {
        const {router} = visTomOpplysning("integer", "2026-08-01");
        const felt = await screen.findByRole<HTMLInputElement>("textbox", {name: "Ny opplysning"});
        felt.focus();
        fireEvent.change(felt, {target: {value: "12345"}});
        felt.setSelectionRange(2, 2);

        fireEvent.keyDown(felt, {key: "Delete"});
        expect(felt.selectionStart).toBe(3);
        fireEvent.change(felt, {target: {value: "12\u00a045", selectionStart: 3, selectionEnd: 3}});

        expect(felt).toHaveValue("1\u00a0245");
        expect(felt.selectionStart).toBe(3);
        router.dispose();
    });

    it.each<Opplysningstype>(["integer", "float"])("viser kr uten at det inngår i %s-verdien", async (type) => {
        const {innsendt, router} = visTomOpplysning(type, "2026-08-01");
        const felt = await screen.findByRole("textbox", {name: "Ny opplysning"});
        expect(screen.getByText("kr")).toHaveAttribute("aria-hidden", "true");
        expect(felt).toHaveAccessibleDescription("Beløp i kroner.");
        expect(felt).toHaveValue("");

        fireEvent.change(felt, {target: {value: "123"}});
        expect(felt).toHaveValue("123");
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(formData.get("opplysning-ny-opplysning")).toBe("123");
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([{
            uuid: "ny-opplysning",
            verdi: 123,
            gyldigFraOgMed: "2026-08-01",
        }]);
        router.dispose();
    });

    const grunnlagMedTomtTallfelt = {
        ...datagrunnlag,
        opplysninger: [
            ...datagrunnlag.opplysninger,
            {
                uuid: "nytt-heltall",
                navn: "Nytt heltall",
                verdi: {type: "integer", verdi: null},
                gyldigFraOgMed: "2026-08-01",
            },
        ],
    };
    const grunnlagMedTomtTallfeltUtenDato = {
        ...grunnlagMedTomtTallfelt,
        opplysninger: grunnlagMedTomtTallfelt.opplysninger.map((opplysning) => (
            opplysning.uuid === "nytt-heltall"
                ? {...opplysning, gyldigFraOgMed: undefined}
                : opplysning
        )),
    };
    const grunnlagMedVerdiUtenDato = {
        ...datagrunnlag,
        opplysninger: [{
            uuid: "uten-dato",
            navn: "Uten dato",
            verdi: {type: "integer", verdi: 10},
        }],
    };

    it("lager StartMigrering fra dialogens data når startknappen trykkes", async () => {
        const {innsendt, router} = visDialog();
        const startKnapp = await screen.findByRole("button", {name: "Start migrering"});
        expect(innsendt).not.toHaveBeenCalled();

        fireEvent.click(startKnapp);
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(formData.get("_action")).toBe("migrer-sak");
        expect(JSON.parse(String(formData.get("grunnlag")))).toEqual({
            sakId: datagrunnlag.sakId,
            initiertAv: datagrunnlag.initiertAv,
            ident: datagrunnlag.ident,
            innvilgetFraOgMed: datagrunnlag.innvilgetFraOgMed,
            opplysninger: [
                {uuid: "tekst", verdi: "verdi", gyldigFraOgMed: "2026-02-01"},
                {uuid: "boolsk", verdi: false, gyldigFraOgMed: "2026-03-01"},
                {uuid: "heltall", verdi: 0, gyldigFraOgMed: "2026-04-01"},
                {uuid: "desimaltall", verdi: 12.5, gyldigFraOgMed: "2026-05-01"},
                {uuid: "dato", verdi: "2026-06-01", gyldigFraOgMed: "2026-06-01"},
            ],
        });
        router.dispose();
    });

    it.each<{type: Opplysningstype; tekst: string; verdi: components["schemas"]["Any"]}>([
        {type: "string", tekst: "  ny tekst  ", verdi: "ny tekst"},
        {type: "string", tekst: "false", verdi: "false"},
        {type: "float", tekst: "12,5", verdi: 12.5},
        {type: "float", tekst: "12.5", verdi: 12.5},
        {type: "float", tekst: "-0,25", verdi: -0.25},
        {type: "float", tekst: "0", verdi: 0},
        {type: "date", tekst: "29.02.2024", verdi: "2024-02-29"},
    ])("sender $type med riktig verdi og datatype", async ({type, tekst, verdi}) => {
        const {innsendt, router} = visTomOpplysning(type);
        const felt = await screen.findByRole("textbox", {name: /^Ny opplysning$/});
        fireEvent.change(felt, {target: {value: tekst}});
        fireEvent.change(screen.getByRole("textbox", {name: "Gyldig fra og med for Ny opplysning"}), {
            target: {value: "01.08.2026"},
        });

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([{
            uuid: "ny-opplysning",
            verdi,
            gyldigFraOgMed: "2026-08-01",
        }]);
        router.dispose();
    });

    it.each([
        {valg: "Ja", verdi: true},
        {valg: "Nei", verdi: false},
    ])("sender $valg som en boolsk verdi", async ({valg, verdi}) => {
        const {innsendt, router} = visTomOpplysning("boolean");
        fireEvent.click(await screen.findByRole("radio", {name: valg}));
        fireEvent.change(screen.getByRole("textbox", {name: "Gyldig fra og med for Ny opplysning"}), {
            target: {value: "01.08.2026"},
        });

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([{
            uuid: "ny-opplysning",
            verdi,
            gyldigFraOgMed: "2026-08-01",
        }]);
        router.dispose();
    });

    it.each<Opplysningstype>(["boolean", "string", "integer", "float", "date"])(
        "utelater ubesvart %s uten å kreve fra-og-med-dato",
        async (type) => {
            const {innsendt, router} = visTomOpplysning(type);
            fireEvent.click(await screen.findByRole("button", {name: "Start migrering"}));
            await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

            const formData: FormData = innsendt.mock.calls[0][0];
            expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([]);
            router.dispose();
        },
    );

    it("utelater tekst som bare inneholder mellomrom", async () => {
        const {innsendt, router} = visTomOpplysning("string");
        fireEvent.change(await screen.findByRole("textbox", {name: /^Ny opplysning$/}), {
            target: {value: "   "},
        });
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([]);
        router.dispose();
    });

    it.each<{type: Opplysningstype; tekst: string; melding: string}>([
        {type: "date", tekst: "31.02.2026", melding: "Skriv en gyldig dato på formen dd.mm.åååå."},
        {type: "date", tekst: "2026-08-01", melding: "Skriv en gyldig dato på formen dd.mm.åååå."},
        {type: "date", tekst: "01.08.26", melding: "Skriv en gyldig dato på formen dd.mm.åååå."},
        {type: "float", tekst: "abc", melding: "Skriv et gyldig tall."},
        {type: "float", tekst: "Infinity", melding: "Skriv et gyldig tall."},
        {type: "float", tekst: "1,2.3", melding: "Skriv et gyldig tall."},
        {type: "float", tekst: "1e3", melding: "Skriv et gyldig tall."},
    ])("stopper ugyldig $type-verdi $tekst", async ({type, tekst, melding}) => {
        const {innsendt, router} = visTomOpplysning(type, "2026-08-01");
        const felt = await screen.findByRole("textbox", {name: /^Ny opplysning$/});
        fireEvent.change(felt, {target: {value: tekst}});

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        expect(felt).toBeInvalid();
        expect(felt).toHaveFocus();
        expect(screen.getByText(melding)).toBeInTheDocument();
        expect(innsendt).not.toHaveBeenCalled();
        router.dispose();
    });

    it.each<{type: Opplysningstype; tekst: string}>([
        {type: "string", tekst: "utfylt"},
        {type: "float", tekst: "0"},
        {type: "date", tekst: "01.08.2026"},
    ])("krever fra-og-med-dato for utfylt $type", async ({type, tekst}) => {
        const {innsendt, router} = visTomOpplysning(type);
        fireEvent.change(await screen.findByRole("textbox", {name: /^Ny opplysning$/}), {
            target: {value: tekst},
        });

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        const dato = screen.getByRole("textbox", {name: "Gyldig fra og med for Ny opplysning"});
        expect(dato).toBeInvalid();
        expect(dato).toHaveFocus();
        expect(innsendt).not.toHaveBeenCalled();
        router.dispose();
    });

    it.each(["Ja", "Nei"])("krever fra-og-med-dato også når brukeren velger %s", async (valg) => {
        const {innsendt, router} = visTomOpplysning("boolean");
        fireEvent.click(await screen.findByRole("radio", {name: valg}));

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        const dato = screen.getByRole("textbox", {name: "Gyldig fra og med for Ny opplysning"});
        expect(dato).toBeInvalid();
        expect(dato).toHaveFocus();
        expect(innsendt).not.toHaveBeenCalled();
        router.dispose();
    });

    it("holder flere ja/nei-opplysninger og datoene deres adskilt", async () => {
        const {innsendt, router} = visDialog(true, {
            ...datagrunnlag,
            opplysninger: [
                {uuid: "forste", navn: "Første valg", verdi: {type: "boolean", verdi: null}},
                {uuid: "andre", navn: "Andre valg", verdi: {type: "boolean", verdi: null}},
            ],
        });
        const forste = await screen.findByRole("radiogroup", {name: "Første valg"});
        const andre = screen.getByRole("radiogroup", {name: "Andre valg"});
        fireEvent.click(within(forste).getByRole("radio", {name: "Ja"}));
        fireEvent.click(within(andre).getByRole("radio", {name: "Nei"}));
        fireEvent.change(screen.getByRole("textbox", {name: "Gyldig fra og med for Første valg"}), {
            target: {value: "01.08.2026"},
        });
        fireEvent.change(screen.getByRole("textbox", {name: "Gyldig fra og med for Andre valg"}), {
            target: {value: "01.09.2026"},
        });

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([
            {uuid: "forste", verdi: true, gyldigFraOgMed: "2026-08-01"},
            {uuid: "andre", verdi: false, gyldigFraOgMed: "2026-09-01"},
        ]);
        router.dispose();
    });

    it("holder datoverdien valgt i kalenderen adskilt fra fra-og-med-dato", async () => {
        const {innsendt, router} = visTomOpplysning("date");
        const rad = await screen.findByRole("row", {name: /Ny opplysning/});
        fireEvent.click(within(rad).getAllByRole("button")[0]);
        fireEvent.click(await screen.findByRole("button", {name: /27/}));
        fireEvent.change(screen.getByRole("textbox", {name: "Gyldig fra og med for Ny opplysning"}), {
            target: {value: "01.08.2026"},
        });

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([{
            uuid: "ny-opplysning",
            verdi: "2026-10-27",
            gyldigFraOgMed: "2026-08-01",
        }]);
        router.dispose();
    });

    it.each(["123", "0", "-10"])("sender utfylt tallfelt %s som et tall", async (verdi) => {
        const {innsendt, router} = visDialog(true, grunnlagMedTomtTallfelt);
        const felt = await screen.findByRole("textbox", {name: /^Nytt heltall$/});

        fireEvent.change(felt, {target: {value: verdi}});
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toContainEqual({
            uuid: "nytt-heltall",
            verdi: Number(verdi),
            gyldigFraOgMed: "2026-08-01",
        });
        router.dispose();
    });

    it.each([false, true])("utelater tomt tallfelt etter redigering: %s", async (rediger) => {
        const {innsendt, router} = visDialog(true, grunnlagMedTomtTallfelt);
        const felt = await screen.findByRole("textbox", {name: /^Nytt heltall$/});
        if (rediger) {
            fireEvent.change(felt, {target: {value: "123"}});
            fireEvent.change(felt, {target: {value: ""}});
        }

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger)
            .not.toContainEqual(expect.objectContaining({uuid: "nytt-heltall"}));
        router.dispose();
    });

    it.each(["1.5", "1,5", "abc", "9007199254740992"])("stopper innsending av ugyldig heltall %s", async (verdi) => {
        const {innsendt, router} = visDialog(true, grunnlagMedTomtTallfelt);
        const felt = await screen.findByRole("textbox", {name: /^Nytt heltall$/});

        fireEvent.change(felt, {target: {value: verdi}});
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        expect(felt).toBeInvalid();
        expect(screen.getByText("Skriv et gyldig heltall.")).toBeInTheDocument();
        expect(felt).toHaveFocus();
        expect(innsendt).not.toHaveBeenCalled();
        router.dispose();
    });

    it.each(["123", "0"])("sender utfylt tall %s med valgt fra-og-med-dato", async (verdi) => {
        const {innsendt, router} = visDialog(true, grunnlagMedTomtTallfeltUtenDato);
        const felt = await screen.findByRole("textbox", {name: /^Nytt heltall$/});

        fireEvent.change(felt, {target: {value: verdi}});
        const dato = screen.getByRole("textbox", {name: "Gyldig fra og med for Nytt heltall"});
        fireEvent.change(dato, {target: {value: "01.08.2026"}});
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toContainEqual({
            uuid: "nytt-heltall",
            verdi: Number(verdi),
            gyldigFraOgMed: "2026-08-01",
        });
        router.dispose();
    });

    it.each(["123", "0"])("stopper migrering når utfylt tall %s mangler fra-og-med-dato", async (verdi) => {
        const {innsendt, router} = visDialog(true, grunnlagMedTomtTallfeltUtenDato);
        const felt = await screen.findByRole("textbox", {name: /^Nytt heltall$/});
        fireEvent.change(felt, {target: {value: verdi}});

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        const dato = screen.getByRole("textbox", {name: "Gyldig fra og med for Nytt heltall"});
        expect(innsendt).not.toHaveBeenCalled();
        expect(dato).toBeInvalid();
        expect(dato).toHaveFocus();
        expect(screen.getByText("Fyll inn gyldighetsdato for opplysningen.")).toBeInTheDocument();
        router.dispose();
    });

    it("sender dato som velges i kalenderen", async () => {
        const {innsendt, router} = visDialog(true, grunnlagMedTomtTallfeltUtenDato);
        const felt = await screen.findByRole("textbox", {name: /^Nytt heltall$/});
        fireEvent.change(felt, {target: {value: "123"}});
        const rad = screen.getByRole("row", {name: /Nytt heltall/});
        fireEvent.click(within(rad).getByRole("button"));
        fireEvent.click(await screen.findByRole("button", {name: /27/}));

        expect(screen.getByRole("textbox", {name: "Gyldig fra og med for Nytt heltall"}))
            .toHaveValue("27.10.2026");
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toContainEqual({
            uuid: "nytt-heltall",
            verdi: 123,
            gyldigFraOgMed: "2026-10-27",
        });
        router.dispose();
    });

    it("viser feil for manglende dato og lar brukeren rette den før innsending", async () => {
        const {innsendt, router} = visDialog(true, grunnlagMedVerdiUtenDato);
        const dato = await screen.findByRole("textbox", {name: "Gyldig fra og med for Uten dato"});

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        expect(innsendt).not.toHaveBeenCalled();
        expect(screen.getByText("Fyll inn gyldighetsdato for opplysningen.")).toBeInTheDocument();
        expect(dato).toBeInvalid();
        expect(dato).toHaveFocus();

        fireEvent.change(dato, {target: {value: "01.08.2026"}});
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());
        expect(screen.queryByText("Fyll inn gyldighetsdato for opplysningen.")).not.toBeInTheDocument();
        router.dispose();
    });

    it.each(["31.02.2026", "2026-08-01", "01.08.26"])("avviser ugyldig gyldighetsdato %s", async (verdi) => {
        const {innsendt, router} = visDialog(true, grunnlagMedVerdiUtenDato);
        const dato = await screen.findByRole("textbox", {name: "Gyldig fra og med for Uten dato"});
        fireEvent.change(dato, {target: {value: verdi}});

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        expect(screen.getByText("Skriv en gyldig dato på formen dd.mm.åååå.")).toBeInTheDocument();
        expect(innsendt).not.toHaveBeenCalled();
        router.dispose();
    });

    it("utelater tom verdi uten å kreve gyldighetsdato", async () => {
        const {innsendt, router} = visDialog(true, grunnlagMedTomtTallfeltUtenDato);
        await screen.findByRole("textbox", {name: /^Nytt heltall$/});

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger)
            .not.toContainEqual(expect.objectContaining({uuid: "nytt-heltall"}));
        router.dispose();
    });

    it("stopper migrering når fra-og-med-dato tømmes igjen", async () => {
        const {innsendt, router} = visDialog(true, grunnlagMedTomtTallfeltUtenDato);
        const felt = await screen.findByRole("textbox", {name: /^Nytt heltall$/});
        fireEvent.change(felt, {target: {value: "123"}});
        const dato = screen.getByRole("textbox", {name: "Gyldig fra og med for Nytt heltall"});
        fireEvent.change(dato, {target: {value: "01.08.2026"}});

        fireEvent.change(dato, {target: {value: ""}});
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));

        expect(innsendt).not.toHaveBeenCalled();
        expect(dato).toBeInvalid();
        expect(screen.getByText("Fyll inn gyldighetsdato for opplysningen.")).toBeInTheDocument();
        router.dispose();
    });

    it("krever gyldighetsdato også for en eksisterende verdi uten dato", async () => {
        const {innsendt, router} = visDialog(true, grunnlagMedVerdiUtenDato);
        const dato = await screen.findByRole("textbox", {name: "Gyldig fra og med for Uten dato"});

        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        expect(innsendt).not.toHaveBeenCalled();
        expect(dato).toBeInvalid();

        fireEvent.change(dato, {target: {value: "01.08.2026"}});
        fireEvent.click(screen.getByRole("button", {name: "Start migrering"}));
        await waitFor(() => expect(innsendt).toHaveBeenCalledOnce());

        const formData: FormData = innsendt.mock.calls[0][0];
        expect(JSON.parse(String(formData.get("grunnlag"))).opplysninger).toEqual([{
            uuid: "uten-dato",
            verdi: 10,
            gyldigFraOgMed: "2026-08-01",
        }]);
        router.dispose();
    });

    it.each([0, 1])("lukkeknapp %i lukker dialogen uten å sende migreringsgrunnlaget", async (index) => {
        const {innsendt, router} = visDialog();

        fireEvent.click((await screen.findAllByRole("button", {name: "Lukk"}))[index]);

        await screen.findByText("Sak");
        expect(innsendt).not.toHaveBeenCalled();
        router.dispose();
    });

    it("deaktiverer startknappen når migrering er avslått", async () => {
        const {innsendt, router} = visDialog(false);

        expect(await screen.findByRole("button", {name: "Start migrering"})).toBeDisabled();
        expect(innsendt).not.toHaveBeenCalled();
        router.dispose();
    });
});
