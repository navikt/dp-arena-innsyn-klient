import {z} from "zod";
import {migrerSak} from "~/features/sak/clients/migrer-sak-client.server";
import {unleash} from "~/utils/unleash.server";
import type {components} from "../../../openapi/arena-migrering-typer";
import {logger} from "~/utils/logger.utils";
import {redirect} from "react-router";

const startMigreringSchema: z.ZodType<components["schemas"]["StartMigreringRequest"]> = z.object({
    migreringsTidspunkt: z.iso.date(),
    simulering: z.boolean(),
});

export async function migrerSakAction(request: Request, sakId: string, formData: FormData) {
    if (!unleash.isEnabled("dp-migrering.start-migrering")) {
        throw new Response("Migrering er ikke tilgjengelig", {status: 403});
    }

    const resultat = startMigreringSchema.safeParse({
        migreringsTidspunkt: formData.get("migreringsTidspunkt"),
        simulering: formData.get("simulering") === "true",
    });

    if (!resultat.success) {
        logger.error(`Validering av start-migrering feilet: ${JSON.stringify(z.treeifyError(resultat.error))}`);
        throw new Response("Ugyldig input", {status: 400});
    }
    logger.info(`Starter migrering for sakId=${sakId} med input: ${JSON.stringify(resultat.data)}`);
    const migrering = await migrerSak(sakId, request, resultat.data);

    return redirect(`/saker/${sakId}/migreringer/${migrering.migreringId}`);
}