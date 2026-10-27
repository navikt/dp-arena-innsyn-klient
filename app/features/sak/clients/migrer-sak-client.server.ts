import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {getHeaders} from "~/utils/fetch.utils";
import {handleHttpProblem} from "~/utils/error-response.utils";
import {arenaMigreringClient} from "~/utils/client.utils.server";
import type {components} from "../../../../openapi/arena-migrering-typer";


export async function hentMigreringDatagrunnlag(request: Request, sakId: string): Promise<components["schemas"]["MigreringGrunnlag"]> {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {data, error, response} = await arenaMigreringClient.GET("/arena/migrering/sak/{sakId}", {
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

export async function migrerSak(request: Request, grunnlag: components["schemas"]["StartMigrering"]) {
    const onBehalfOfToken = await getSaksbehandlingOboToken(request);

    const {error, response} = await arenaMigreringClient.POST("/arena/migrering/sak/{sakId}", {
        headers: getHeaders(onBehalfOfToken),
        params: {
            path: {sakId: grunnlag.sakId.toString()},
        },
        body: grunnlag,
    });

    if (error) {
        handleHttpProblem(error);
    }

    if (response.status === 202) {
        return null;
    }

    throw new Error(`Uhåndtert feil ved migrering. ${response.status} - ${response.statusText}`);
}
