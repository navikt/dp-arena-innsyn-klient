import { parseFormData, validationError } from "@rvf/react-router";
import { redirect } from "react-router";

import { sokPerson } from "~/features/person/clients/person-client.server";
import { hentValideringForPersonIdent } from "~/utils/validering.util";

export async function sokPersonAction(request: Request, formData: FormData) {
  const validertSkjema = await parseFormData(formData, hentValideringForPersonIdent());

  if (validertSkjema.error) {
    return validationError(validertSkjema.error);
  }

  const { personIdent } = validertSkjema.data;
  const personResponse = await sokPerson(request, personIdent);

  return redirect(`/person/${personResponse.id}/saker`);
}
