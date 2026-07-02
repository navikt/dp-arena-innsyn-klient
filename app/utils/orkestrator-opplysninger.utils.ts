import { components } from "@/openapi/soknad-orkestrator-typer";

import { formaterTilNorskDato } from "./dato.utils";

export function hentOrkestratorBarnOpplysningLabel(opplysningId: string) {
  const opplysninger = [
    { id: "fornavnOgMellomnavn", label: "Fornavn" },
    { id: "etternavn", label: "Etternavn" },
    { id: "fodselsdato", label: "Fødselsdato" },
    { id: "oppholdssted", label: "Oppholdssted" },
    { id: "forsorgerBarnet", label: "Forsørger barnet" },
    { id: "barnetilleggFom", label: "Barnetillegg fra" },
    { id: "barnetilleggTom", label: "Barnetillegg til" },
    { id: "kvalifisererTilBarnetillegg", label: "Rett til barnetillegg" },
    { id: "begrunnelse", label: "Begrunnelse" },
  ];

  // Returner label hvis key finnes, eller returnerer key med første bokstaven uppercase
  return (
    opplysninger.find((opplysning) => opplysning.id === opplysningId)?.label ||
    opplysningId.charAt(0).toUpperCase() + opplysningId.slice(1)
  );
}

export function formatterOrkestratorOpplysningVerdi(
  opplysning: components["schemas"]["BarnOpplysning"],
  orkestratorLandliste: components["schemas"]["Land"][],
): string {
  switch (opplysning.dataType) {
    case "boolsk":
      return opplysning.verdi === "true" ? "Ja" : "Nei";

    case "dato":
      return formaterTilNorskDato(opplysning.verdi);

    case "land":
      return hentLand(opplysning.verdi, orkestratorLandliste);

    default:
      return opplysning.verdi;
  }
}

function hentLand(lankode: string, orkestratorLandliste: components["schemas"]["Land"][]): string {
  return (
    orkestratorLandliste?.find((land: components["schemas"]["Land"]) => land.alpha3kode === lankode)
      ?.navn || ""
  );
}
