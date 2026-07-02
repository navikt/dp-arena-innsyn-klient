import createClient from "openapi-fetch";
import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {getEnv} from "~/utils/env.utils";
import {handleHttpProblem} from "~/utils/error-response.utils";
import {getHeaders} from "~/utils/fetch.utils";

import type {components, paths} from "../../openapi/arena-sak-innsyn-typer";

const saksbehandlerClient = createClient<paths>({baseUrl: getEnv("DP_ARENA_GW_URL")});


export async function sokPerson(request: Request, ident: string) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);
    const body: components["schemas"]["IdentForesporsel"] = {
        ident: ident
    }
    const {data, error, response} = await saksbehandlerClient.POST("/arena/innsyn/person", {
        headers: getHeaders(onBehalfOfToken),
        body: body,
    });

    if (data) {
        return data;
    }

    if (error) {
        handleHttpProblem(error);
    }

    throw new Error(`Uhåndtert feil i hentPerson(). ${response.status} - ${response.statusText}`);
}

export async function hentSakerForPerson(request: Request, personId: number) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await saksbehandlerClient.GET("/arena/innsyn/sak/person/{personId}", {
        headers: getHeaders(onBehalfOfToken),
        params: {
            path: {personId},
        },
    });


    if (data) {
        return data;
    }

    if (error) {
        handleHttpProblem(error);
    }

    throw new Error(`Uhåndtert feil i hentSakerForPerson(). ${response.status} - ${response.statusText}`);
}

export async function hentPerson(request: Request, personId: number) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await saksbehandlerClient.GET("/arena/innsyn/person/{personId}", {
        headers: getHeaders(onBehalfOfToken),
        params: {
            path: {personId},
        },
    });


    if (data) {
        return data;
    }

    if (error) {
        handleHttpProblem(error);
    }

    throw new Error(`Uhåndtert feil i hentPerson(). ${response.status} - ${response.statusText}`);
}

export async function hentSakForPerson(request: Request, sakId: string) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await saksbehandlerClient.GET("/arena/innsyn/sak/{sakid}/detaljert", {
        headers: getHeaders(onBehalfOfToken),
        params: {
            path: {sakid: sakId},
        },
    });


    if (data) {
        return data;
    }

    if (error) {
        handleHttpProblem(error);
    }

    throw new Error(`Uhåndtert feil i hentSakForPerson(). ${response.status} - ${response.statusText}`);
}


