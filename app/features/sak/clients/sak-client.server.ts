import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {getHeaders} from "~/utils/fetch.utils";
import {handleHttpProblem} from "~/utils/error-response.utils";
import {arenaInnsynsClient} from "~/utils/client.utils.server";


export async function hentSakForPerson(request: Request, sakId: string) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await arenaInnsynsClient.GET("/arena/innsyn/sak/{sakid}/detaljert", {
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

export async function hentSakerForPerson(request: Request, personId: number) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await arenaInnsynsClient.GET("/arena/innsyn/sak/person/{personId}", {
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