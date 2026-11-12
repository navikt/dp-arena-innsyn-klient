import {z} from "zod";


export function hentValideringForPersonIdent() {
    return z.object({
        personIdent: z
            .string()
            .regex(/^\d+$/, {message: "Fødselsnummer kan kun inneholde tall"})
            .length(11, {message: "Fødselsnummer må være 11 siffer"}),
    });
}

export function validerStartMigrering() {
    return z.object({
        simulering: z
            .enum(["true"])
            .optional()
            .transform((value) => value === "true"),
        migreringsTidspunkt: z.iso.date({
            error: "Velg en gyldig migreringsdato",
        }),
    });
}


