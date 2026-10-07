import { parseFormData, validationError } from "@rvf/react-router";
import { redirect } from "react-router";

import { sokPerson } from "~/features/person/clients/person-client.server";
import { hentValideringForPersonIdent } from "~/utils/validering.util";
import {logger} from "~/utils/logger.utils";

export async function sokPersonAction(request: Request, formData: FormData) {
  logger.info("Søker etter person med ident fra formdata");
  const validertSkjema = await parseFormData(formData, hentValideringForPersonIdent());
  logger.info(` Validerer skjema error: ${validertSkjema.error}`);

  if (validertSkjema.error) {
    return validationError(validertSkjema.error);
  }

  const { personIdent } = validertSkjema.data;
  const personResponse = await sokPerson(request, personIdent);
  logger.info(` Fikk respons fra sokPerson: ${JSON.stringify(personResponse)}`);

  if (!personResponse || !personResponse.id) {
    logger.warn(`Ingen person funnet for ident: ${personIdent}`);
    throw new Response("Ingen person funnet", { status: 404 });
  }

  return redirect(`/person/${personResponse.id}/saker`);
}
