import {useEffect, useReducer, useState} from "react";
import {z} from "zod";


const hendelseSchema = z.looseObject({
    id: z.number().int().optional(),
    hendelse: z.string().optional(),
    tidspunkt: z.string().optional(),
    opprinnelse: z.string().optional(),
});

export type Migreringshendelse = z.infer<typeof hendelseSchema>;

type HendelsesAction =
    | { type: "mottatt"; hendelse: Migreringshendelse }
    | { type: "nullstill" };

function reducer(hendelser: Migreringshendelse[], action: HendelsesAction) {
    return action.type === "nullstill" ? [] : [...hendelser, action.hendelse];
}

const hendelsesnavn = [
    "MIGRERING_STARTET",
    "MIGRERING_STARTET_MED_MANGLENDE_OPPLYSNINGER",
    "MIGRERING_AVBRUTT",
];

export function useMigreringshendelser(migreringId?: string) {
    const [connected, setConnected] = useState(false);
    const [hendelser, dispatch] = useReducer(reducer, []);
    const [feil, setFeil] = useState<string | null>(null);

    useEffect(() => {
        setConnected(false);
        dispatch({type: "nullstill"});
        setFeil(null);
        if (!migreringId) {
            return;
        }

        const eventSource = new EventSource(
            `/api/migrering/${encodeURIComponent(migreringId)}/oppdateringer`,
        );

        const handler = (melding: MessageEvent) => {
            try {
                const data = hendelseSchema.parse(JSON.parse(melding.data));
                const id = melding.lastEventId
                    ? z.coerce.number().int().positive().parse(melding.lastEventId)
                    : data.id;
                const hendelse = {
                    ...data,
                    ...(id !== undefined ? {id} : {}),
                    ...(melding.type !== "message" ? {hendelse: data.hendelse ?? melding.type} : {}),
                };
                dispatch({type: "mottatt", hendelse});
            } catch (error) {
                if (!(error instanceof SyntaxError) && !(error instanceof z.ZodError)) {
                    throw error;
                }
                eventSource.close();
                setConnected(false);
                setFeil("Hendelsesstrømmen inneholder en ugyldig melding.");
            }
        };

        const navngitteHendelser = hendelsesnavn.flatMap((navn) => [navn, navn.toLowerCase()]);
        for (const navn of navngitteHendelser) {
            eventSource.addEventListener(navn, handler);
        }

        eventSource.onopen = () => {
            setConnected(true);
            setFeil(null);
        };

        eventSource.onmessage = handler;

        eventSource.onerror = () => {
            setConnected(false);
            setFeil(eventSource.readyState === EventSource.CLOSED
                ? "Kunne ikke åpne hendelsesstrømmen."
                : "Forbindelsen ble brutt. Prøver å koble til igjen.");
        };

        return () => {
            eventSource.onopen = null;
            eventSource.onmessage = null;
            eventSource.onerror = null;
            for (const navn of navngitteHendelser) {
                eventSource.removeEventListener(navn, handler);
            }
            eventSource.close();
        };
    }, [migreringId]);

    return {connected, hendelser, feil};
}
