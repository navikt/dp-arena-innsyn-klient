import type {LoaderFunctionArgs} from "react-router";
import {z} from "zod";
import {hentMigreringsstrom} from "~/features/migrering/clients/migrering-oppdateringer.server";

function erKlientavbrudd(error: unknown, signal: AbortSignal) {
    return signal.aborted && (
        error === signal.reason
        || (error instanceof Error && error.name === "AbortError")
    );
}

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

    let response: Response;
    try {
        response = await hentMigreringsstrom(request, resultat.data, cursorResultat.data ?? undefined);
    } catch (error) {
        if (!erKlientavbrudd(error, request.signal)) {
            throw error;
        }
        return new Response(null, {status: 499, statusText: "Client Closed Request"});
    }

    if (!response.ok) {
        return response;
    }

    const contentType = response.headers.get("Content-Type");
    if (!contentType?.toLowerCase().startsWith("text/event-stream") || !response.body) {
        await response.body?.cancel();
        throw new Response("Ugyldig hendelsesstrøm fra backend", {status: 502});
    }

    const reader = response.body.getReader();
    let kansellert = false;
    const body = new ReadableStream<Uint8Array>({
        async pull(controller) {
            try {
                const {done, value} = await reader.read();
                if (kansellert) {
                    return;
                }
                if (done) {
                    controller.close();
                    reader.releaseLock();
                } else {
                    controller.enqueue(value);
                }
            } catch (error) {
                if (kansellert) {
                    return;
                }
                reader.releaseLock();
                if (erKlientavbrudd(error, request.signal)) {
                    controller.close();
                } else {
                    controller.error(error);
                }
            }
        },
        async cancel(reason) {
            kansellert = true;
            try {
                await reader.cancel(reason);
            } catch (error) {
                if (!erKlientavbrudd(error, request.signal)) {
                    throw error;
                }
            } finally {
                reader.releaseLock();
            }
        },
    });

    return new Response(body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
        },
    });
}