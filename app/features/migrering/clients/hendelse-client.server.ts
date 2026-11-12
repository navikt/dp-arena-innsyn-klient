import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {arenaMigreringClient} from "~/utils/client.utils.server";
import {handleHttpProblem} from "~/utils/error-response.utils";
import {getHeaders} from "~/utils/fetch.utils";
import type {components} from "../../../../openapi/arena-migrering-typer";

export type MigreringHendelseResponse = components["schemas"]["MigreringHendelseResponse"];

export async function hentHendelse(request: Request, hendelseId: number) {
    const token = await getSaksbehandlingOboToken(request);
    const {data, error, response} = await arenaMigreringClient.GET("/arena/migrering/hendelse/{hendelseId}", {
        headers: getHeaders(token),
        params: {path: {hendelseId}},
        signal: request.signal,
        cache: "no-store",
    });

    if (error) {
        handleHttpProblem({
            type: "about:blank",
            title: "Kunne ikke hente hendelsen",
            status: response.status,
        });
    }

    if (!response.ok) {
        throw new Response("Kunne ikke hente hendelsen", {status: response.status});
    }

    if (response.status !== 200 || !data) {
        throw new Response("Ugyldig svar fra hendelses-API", {status: 502});
    }

    return data as MigreringHendelseResponse;
}
