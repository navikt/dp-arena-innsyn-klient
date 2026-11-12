import type {LoaderFunctionArgs} from "react-router";
import {z} from "zod";
import {hentMigreringsstrom} from "~/features/migrering/clients/migrering-oppdateringer.server";

export async function loader({request, params}: LoaderFunctionArgs) {
    const resultat = z.uuid().safeParse(params.migreringId);

    if (!resultat.success) {
        throw new Response("Ugyldig migrerings-ID", {status: 400});
    }

    const cursor = request.headers.get("Last-Event-ID")
        ?? new URL(request.url).searchParams.get("since");
    const cursorResultat = z.string().regex(/^\d+$/).nullable().safeParse(cursor);
    if (!cursorResultat.success) {
        throw new Response("Ugyldig hendelses-ID", {status: 400});
    }

    const response = await hentMigreringsstrom(request, resultat.data, cursorResultat.data ?? undefined);

    if (!response.ok) {
        return response;
    }

    const contentType = response.headers.get("Content-Type");
    if (!contentType?.toLowerCase().startsWith("text/event-stream") || !response.body) {
        await response.body?.cancel();
        throw new Response("Ugyldig hendelsesstrøm fra backend", {status: 502});
    }

    return new Response(response.body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    });
}