import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {handleHttpProblem} from "~/utils/error-response.utils";
import {getHeaders} from "~/utils/fetch.utils";

import type {components} from "../../../../openapi/arena-sak-innsyn-typer";
import {arenaInnsynsClient} from "~/utils/client.utils.server";


export async function sokPerson(request: Request, ident: string) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);
    const body: components["schemas"]["IdentForesporsel"] = {
        ident: ident
    }
    const {data, error, response} = await arenaInnsynsClient.POST("/arena/innsyn/person", {
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


export async function hentPerson(request: Request, personId: number) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await arenaInnsynsClient.GET("/arena/innsyn/person/{personId}", {
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




