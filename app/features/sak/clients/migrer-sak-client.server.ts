import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {getHeaders} from "~/utils/fetch.utils";
import {handleHttpProblem} from "~/utils/error-response.utils";
import {arenaMigreringClient} from "~/utils/client.utils.server";


export async function migrerSak(request: Request, sakId: string) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await arenaMigreringClient.POST("/arena/migrering/sak/{sakId}", {
        headers: getHeaders(onBehalfOfToken),
        params: {
            path: {sakId: sakId},
        },
    });


    if (data) {
        return data;
    }

    if (error) {
        handleHttpProblem(error);
    }

    throw new Error(`Uhåndtert feil ved migrering. ${response.status} - ${response.statusText}`);
}

