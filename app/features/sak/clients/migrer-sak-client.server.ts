import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {getHeaders} from "~/utils/fetch.utils";
import {handleHttpProblem} from "~/utils/error-response.utils";
import {arenaMigreringClient} from "~/utils/client.utils.server";
import type {components} from "../../../../openapi/arena-migrering-typer";


export type StartMigreringResponse = components["schemas"]["StartMigreringResponse"];

export async function migrerSak(sakId: string, request: Request, grunnlag: components["schemas"]["StartMigreringRequest"]) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await arenaMigreringClient.POST("/arena/migrering/sak/{sakId}", {
        headers: getHeaders(onBehalfOfToken),
        params: {
            path: {sakId: sakId},
        },
        body: grunnlag,
    });

    if (error) {
        handleHttpProblem(error);
    }

    if (response.status === 201) {
        return data as components["schemas"]["StartMigreringResponse"];
    }

    throw new Error(`Uhåndtert feil ved migrering. ${response.status} - ${response.statusText}`);
}
