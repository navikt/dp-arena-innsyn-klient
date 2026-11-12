import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {arenaMigreringClient} from "~/utils/client.utils.server";
import {handleHttpProblem} from "~/utils/error-response.utils";
import {getHeaders} from "~/utils/fetch.utils";
import type {components} from "../../../../openapi/arena-migrering-typer";

export type MigreringListeResponse = components["schemas"]["StartMigreringResponse"][];

export async function hentMigrering(request: Request, migreringId: string) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await arenaMigreringClient.GET("/arena/migrering/{migreringId}", {
        headers: getHeaders(onBehalfOfToken),
        params: {path: {migreringId}},
    });

    if (error) {
        handleHttpProblem({
            type: "about:blank",
            title: "Kunne ikke hente migreringen",
            status: response.status,
        });
    }

    if (!response.ok) {
        throw new Response("Kunne ikke hente migreringen", {status: response.status});
    }

    if (response.status !== 200 || !data) {
        throw new Response("Ugyldig svar fra migrerings-API", {status: 502});
    }

    return data as components["schemas"]["StartMigreringResponse"];
}

export async function hentMigreringer(request: Request, sakId: string) {
    const token = await getSaksbehandlingOboToken(request);
    const {data, error, response} = await arenaMigreringClient.GET("/arena/migrering/sak/{sakId}", {
        headers: getHeaders(token),
        params: {path: {sakId}},
        signal: request.signal,
        cache: "no-store",
    });

    if (error) {
        handleHttpProblem({
            type: "about:blank",
            title: "Kunne ikke hente migreringene",
            status: response.status,
        });
    }

    if (!response.ok) {
        throw new Response("Kunne ikke hente hendelsen", {status: response.status});
    }

    if (response.status !== 200 || !data) {
        throw new Response("Ugyldig svar fra hendelses-API", {status: 502});
    }

    return data as MigreringListeResponse;
}
