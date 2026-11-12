import {getSaksbehandlingOboToken} from "~/utils/auth.utils.server";
import {getEnv} from "~/utils/env.utils";

export async function hentMigreringsstrom(
    request: Request,
    migreringId: string,
    sisteHendelsesId?: string,
): Promise<Response> {
    const token = await getSaksbehandlingOboToken(request);
    const baseUrl = getEnv("DP_MIGRERING_URL").replace(/\/$/, "");
    const headers = new Headers({
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
    });
    if (sisteHendelsesId !== undefined) {
        headers.set("Last-Event-ID", sisteHendelsesId);
    }

    return fetch(`${baseUrl}/arena/migrering/${encodeURIComponent(migreringId)}/oppdateringer`, {
        headers,
        signal: request.signal,
        cache: "no-store",
    });
}
