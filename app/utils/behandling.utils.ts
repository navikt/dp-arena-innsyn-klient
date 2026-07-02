import { skalViseOpplysning } from "~/utils/opplysning.utils";
import { isDefined } from "~/utils/type-guards";

import { components } from "../../openapi/behandling-typer";

export function skalViseRegelsett(
  regelsett: components["schemas"]["Regelsett"],
  opplysninger: components["schemas"]["RedigerbareOpplysninger"][],
  visArvedeOpplysninger: boolean,
) {
  return (
    regelsett.opplysninger
      .map((opplysningTypeId) =>
        opplysninger.find((opplysning) => opplysning.opplysningTypeId === opplysningTypeId),
      )
      .filter(isDefined)
      .filter((opplysning) => skalViseOpplysning(opplysning, visArvedeOpplysninger)).length > 0
  );
}
