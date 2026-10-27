import {z} from "zod";
import {migrerSak} from "~/features/sak/clients/migrer-sak-client.server";
import {unleash} from "~/utils/unleash.server";
import type {components} from "../../../openapi/arena-migrering-typer";
import {logger} from "~/utils/logger.utils";

const startMigreringSchema: z.ZodType<components["schemas"]["StartMigrering"]> = z.object({
    sakId: z.number().int().positive(),
    initiertAv: z.string().min(1),
    ident: z.string().regex(/^\d{11}$/),
    innvilgetFraOgMed: z.iso.date(),
    innvilgetTilOgMed: z.iso.date().optional(),
    opplysninger: z.array(z.object({
        uuid: z.uuid(),
        verdi: z.union([z.string(), z.number(), z.boolean()]),
        gyldigFraOgMed: z.iso.date(),
    })),
});

export async function migrerSakAction(request: Request, sakId: string, formData: FormData) {
    if (!unleash.isEnabled("dp-migrering.start-migrering")) {
        throw new Response("Migrering er ikke tilgjengelig", {status: 403});
    }

    const innsendtGrunnlag = formData.get("grunnlag");
    if (typeof innsendtGrunnlag !== "string") {
        throw new Response("Mangler migreringsgrunnlag", {status: 400});
    }

    let grunnlag: unknown;
    try {
        grunnlag = JSON.parse(innsendtGrunnlag);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Response("Ugyldig JSON i migreringsgrunnlag", {status: 400});
        }
        throw error;
    }

    const resultat = startMigreringSchema.safeParse(grunnlag);
    if (!resultat.success || resultat.data.sakId.toString() !== sakId) {
        throw new Response("Ugyldig migreringsgrunnlag", {status: 400});
    }

    logger.info(`Starter migrering for sakId: ${sakId}`);
    logger.info(`Antall opplysninger: ${resultat.data.opplysninger.length}`);
    return await migrerSak(request, resultat.data);
}