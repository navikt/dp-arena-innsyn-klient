// @vitest-environment happy-dom

import {act, cleanup, renderHook} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {useMigreringshendelser} from "~/features/migrering/use-migreringshendelser";

class MockEventSource extends EventTarget {
    static CLOSED = 2;
    static instanser: MockEventSource[] = [];
    readyState = 0;
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onmessage: ((event: MessageEvent<string>) => void) | null = null;
    close = vi.fn(() => {
        this.readyState = MockEventSource.CLOSED;
    });

    constructor(public url: string) {
        super();
        MockEventSource.instanser.push(this);
    }

    send(hendelse: Record<string, unknown>, lastEventId = "") {
        this.onmessage?.(new MessageEvent("message", {
            data: JSON.stringify(hendelse),
            lastEventId,
        }));
    }

    sendNavngitt(navn: string, hendelse: Record<string, unknown>, lastEventId: string) {
        this.dispatchEvent(new MessageEvent(navn, {
            data: JSON.stringify(hendelse),
            lastEventId,
        }));
    }
}

beforeEach(() => {
    MockEventSource.instanser = [];
    vi.stubGlobal("EventSource", MockEventSource);
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe("useMigreringshendelser", () => {
    it("venter uten a opprette forbindelse nar migrerings-ID mangler", () => {
        const {result} = renderHook(() => useMigreringshendelser());
        expect(result.current.connected).toBe(false);
        expect(result.current.feil).toBeNull();
        expect(result.current.hendelser).toEqual([]);
        expect(MockEventSource.instanser).toHaveLength(0);
    });

    it("kobler til riktig rute og oppdaterer forbindelsesstatus", () => {
        const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
        const kilde = MockEventSource.instanser[0];
        expect(kilde.url).toBe("/api/migrering/migrering-1/oppdateringer");
        expect(result.current.connected).toBe(false);

        act(() => kilde.onopen?.());
        expect(result.current.connected).toBe(true);
    });

    it("samler hendelser uten filtrering og beholder alle JSON-feltene", () => {
        const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
        const kilde = MockEventSource.instanser[0];

        act(() => {
            kilde.send({
                id: 42,
                hendelse: "MIGRERING_STARTET",
                tidspunkt: "2026-11-10T10:04:34",
                initiertAv: "syntetisk-ident",
                detaljer: {status: "startet"},
            }, "42");
            kilde.send({id: 43, hendelse: "UKJENT_HENDELSE"}, "43");
        });

        expect(result.current.hendelser).toEqual([
            {
                id: 42,
                hendelse: "MIGRERING_STARTET",
                tidspunkt: "2026-11-10T10:04:34",
                initiertAv: "syntetisk-ident",
                detaljer: {status: "startet"},
            },
            {id: 43, hendelse: "UKJENT_HENDELSE"},
        ]);
    });

    it("lar EventSource koble til pa nytt ved midlertidig feil", () => {
        const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
        const kilde = MockEventSource.instanser[0];

        act(() => {
            kilde.send({id: 42, hendelse: "MIGRERING_STARTET"}, "42");
            kilde.onerror?.();
        });

        expect(kilde.close).not.toHaveBeenCalled();
        expect(result.current.connected).toBe(false);
        expect(result.current.feil).not.toBeNull();

        act(() => kilde.onopen?.());
        expect(result.current.connected).toBe(true);
        expect(result.current.feil).toBeNull();
        expect(result.current.hendelser).toHaveLength(1);
        expect(MockEventSource.instanser).toHaveLength(1);
    });

    it.each([
        "MIGRERING_STARTET",
        "MIGRERING_STARTET_MED_MANGLENDE_OPPLYSNINGER",
        "MIGRERING_AVBRUTT",
        "migrering_startet",
        "migrering_startet_med_manglende_opplysninger",
        "migrering_avbrutt",
    ])(
        "leser SSE-feltene event og id for %s",
        (navn) => {
            const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
            const kilde = MockEventSource.instanser[0];
            act(() => kilde.sendNavngitt(navn, {tidspunkt: "2026-11-12T12:00:00"}, "42"));

            expect(result.current.hendelser).toEqual([{
                id: 42,
                hendelse: navn,
                tidspunkt: "2026-11-12T12:00:00",
            }]);
        },
    );

    it("ignorerer kontrollhendelser uten a legge dem i historikken", () => {
        const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
        const kilde = MockEventSource.instanser[0];
        act(() => {
            kilde.sendNavngitt("ping", {}, "");
            kilde.sendNavngitt("close", {reason: "reauth"}, "");
        });

        expect(result.current.hendelser).toEqual([]);
        expect(result.current.feil).toBeNull();
    });

    it("bruker database-ID fra SSE fremfor en ID inne i hendelsesdata", () => {
        const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
        act(() => MockEventSource.instanser[0].sendNavngitt("MIGRERING_STARTET", {id: 7}, "42"));

        expect(result.current.hendelser[0].id).toBe(42);
    });

    it("viser feil ved ugyldig database-ID i SSE", () => {
        const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
        const kilde = MockEventSource.instanser[0];
        act(() => kilde.sendNavngitt("MIGRERING_STARTET", {}, "ugyldig"));

        expect(result.current.hendelser).toEqual([]);
        expect(result.current.feil).toBe("Hendelsesstrømmen inneholder en ugyldig melding.");
        expect(kilde.close).toHaveBeenCalledOnce();
    });

    it("viser feil dersom EventSource har avsluttet forbindelsen", () => {
        const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
        const kilde = MockEventSource.instanser[0];
        kilde.readyState = MockEventSource.CLOSED;

        act(() => kilde.onerror?.());
        expect(result.current.connected).toBe(false);
        expect(result.current.feil).not.toBeNull();
    });

    it("nullstiller historikk og lukker gammel forbindelse ved ny migrerings-ID", () => {
        const {result, rerender} = renderHook(({id}) => useMigreringshendelser(id), {
            initialProps: {id: "migrering-1"},
        });
        const gammelKilde = MockEventSource.instanser[0];
        act(() => gammelKilde.send({id: 42, hendelse: "MIGRERING_STARTET"}, "42"));

        rerender({id: "migrering-2"});
        expect(gammelKilde.close).toHaveBeenCalledOnce();
        expect(result.current.hendelser).toEqual([]);

        act(() => gammelKilde.send({id: 43, hendelse: "UTDATERT"}, "43"));
        act(() => gammelKilde.sendNavngitt("MIGRERING_STARTET", {}, "44"));
        expect(result.current.hendelser).toEqual([]);
    });

    it.each(["ikke JSON", "[]", '{"hendelse":42}'])("viser feil ved ugyldig melding %s", (data) => {
        const {result} = renderHook(() => useMigreringshendelser("migrering-1"));
        const kilde = MockEventSource.instanser[0];

        act(() => kilde.onmessage?.(new MessageEvent("message", {data})));
        expect(result.current.connected).toBe(false);
        expect(result.current.feil).not.toBeNull();
        expect(kilde.close).toHaveBeenCalledOnce();
    });

    it("lukker forbindelsen ved unmount", () => {
        const {unmount} = renderHook(() => useMigreringshendelser("migrering-1"));
        const kilde = MockEventSource.instanser[0];
        unmount();
        expect(kilde.close).toHaveBeenCalledOnce();
        expect(MockEventSource.instanser).toHaveLength(1);
    });
});
