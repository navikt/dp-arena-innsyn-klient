import {z} from "zod";


export function hentValideringForPersonIdent() {
    return z.object({
        personIdent: z
            .string()
            .regex(/^\d+$/, {message: "Fødselsnummer kan kun inneholde tall"})
            .length(11, {message: "Fødselsnummer må være 11 siffer"}),
    });
}



