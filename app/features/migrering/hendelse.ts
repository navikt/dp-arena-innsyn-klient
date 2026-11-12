import {data, type LoaderFunctionArgs} from "react-router";
import {z} from "zod";
import {hentHendelse} from "~/features/migrering/clients/hendelse-client.server";

const headers = {"Cache-Control": "no-store"};

export async function loader({request, params}: LoaderFunctionArgs) {
    const resultat = z.coerce.number().int().positive().safeParse(params.hendelseId);
    if (!resultat.success) {
        return data({hendelse: null, feil: "Ugyldig hendelses-ID."}, {status: 400, headers});
    }

    try {
        const hendelse = await hentHendelse(request, resultat.data);
        return data({hendelse, feil: null}, {headers});
    } catch (error) {
        if (!(error instanceof Response)) {
            throw error;
        }

        const feilmeldinger: Partial<Record<number, string>> = {
            400: "Ugyldig hendelses-ID.",
            401: "Du må logge inn på nytt for å hente hendelsen.",
            403: "Du har ikke tilgang til hendelsen, eller den finnes ikke.",
        };
        const feil = feilmeldinger[error.status] ?? "Kunne ikke hente hendelsen. Prøv igjen.";
        return data({hendelse: null, feil}, {status: error.status, headers});
    }
}
