import { getISOWeek } from "date-fns";

import { formaterTilNorskDato } from "~/utils/dato.utils";
import { formaterTallMedTusenSeperator } from "~/utils/number.utils";
import { isBarneliste, isRedigerbareOpplysninger } from "~/utils/type-guards";

import { components } from "../../openapi/behandling-typer";
import { logger } from "./logger.utils";

export function formaterOpplysningVerdi(
  opplysningsverdi: components["schemas"]["Opplysningsverdi"],
) {
  switch (opplysningsverdi.datatype) {
    case "tekst":
      return opplysningsverdi.verdi;
    case "inntekt":
      return `${opplysningsverdi.verdi} inntekt`;
    case "dato":
      return formaterTilNorskDato(opplysningsverdi.verdi);
    case "heltall":
      return `${formaterTallMedTusenSeperator(opplysningsverdi.verdi)} ${formaterOpplysningEnhet(opplysningsverdi.enhet)}`;
    case "desimaltall":
      return `${formaterTallMedTusenSeperator(opplysningsverdi.verdi)} ${formaterOpplysningEnhet(opplysningsverdi.enhet)}`;
    case "penger":
      return `${formaterTallMedTusenSeperator(opplysningsverdi.verdi)} kr`;
    case "ulid":
      return `${opplysningsverdi.verdi} ulid`;
    case "boolsk":
      return opplysningsverdi.verdi ? "Ja" : "Nei";
    case "periode":
      return `Uke ${getISOWeek(opplysningsverdi.fom)} - ${getISOWeek(opplysningsverdi.tom)} (${formaterTilNorskDato(opplysningsverdi.fom)} - ${formaterTilNorskDato(opplysningsverdi.tom)})`;
    case "barn":
      if (isBarneliste(opplysningsverdi)) {
        return opplysningsverdi.søknadBarnId ?? "Mangler søknadBarnId";
      }
      return "Formatering av barn feiler: Verdi er ikke en barneliste";

    default:
      // @ts-expect-error Alle datatyper er dekket av switchen så den får type never, men vi må håndtere at API blir utvidet med nye datatyper
      return `Mangler formattering for datatype: ${opplysningsverdi.datatype}`;
  }
}

export function formaterOpplysningEnhet(enhet?: components["schemas"]["Enhet"]): string {
  switch (enhet) {
    case "timer":
      return "timer";
    case "prosent":
      return "%";
    case "G":
      return "G";
    case "dager":
      return "dager";
    case "uker":
      return "uker";
    case "måneder":
      return "måneder";
    case "år":
      return "år";

    default:
      return "";
  }
}

export function konverterOpplysningVerdiTilSkjemaVerdi(
  verdi: components["schemas"]["Opplysningsverdi"],
): string {
  switch (verdi.datatype) {
    case "tekst":
      return verdi.verdi;
    case "inntekt":
      return verdi.verdi;
    case "dato":
      return formaterTilNorskDato(verdi.verdi);
    case "heltall":
      return verdi.verdi.toString();
    case "desimaltall":
      return Number(verdi.verdi).toLocaleString("nb-NO");
    case "penger":
      return verdi.verdi.toString();
    case "ulid":
      return verdi.verdi;
    case "boolsk":
      return verdi.verdi ? "Ja" : "Nei";
    case "periode":
      return `${verdi.fom} - ${verdi.tom}`;
    case "barn":
      return JSON.stringify(verdi.verdi);
  }
}

// Rettighetsperiode har alltid en startdato,
// og kan ha en sluttdato eller vare til evig tid (null).
// Opplysningsperiode kan ha både start- og sluttdato.
// Hvis opplysningsperiodens start er null, betyr det at opplysningen gjelder fra tidenes morgen.
// Hvis opplysningsperiodens slutt er null, betyr det at opplysningen gjelder til evig tid.
export function erOpplysningsperiodeInnenforRettighetsperiode(
  rettighetsperiode: components["schemas"]["Rettighetsperiode"],
  opplysningsperiode: components["schemas"]["Opplysningsperiode"],
) {
  // Opplysningsperioden har start og slutt, rettighetsperiode har en slutt
  if (
    opplysningsperiode.gyldigFraOgMed &&
    opplysningsperiode.gyldigTilOgMed &&
    rettighetsperiode.tilOgMed
  ) {
    // Opplysningsperioden starter og stopper innenfor rettighetsperioden
    return (
      opplysningsperiode.gyldigFraOgMed >= rettighetsperiode.fraOgMed &&
      opplysningsperiode.gyldigTilOgMed <= rettighetsperiode.tilOgMed
    );
  }

  // Opplysningsperioden har start, men ingen slutt, rettighetsperiode har ingen slutt
  if (
    opplysningsperiode.gyldigFraOgMed &&
    !opplysningsperiode.gyldigTilOgMed &&
    !rettighetsperiode.tilOgMed
  ) {
    // Opplysningsperioden starter etter eller samtidig som rettighetsperiodens start
    return opplysningsperiode.gyldigFraOgMed >= rettighetsperiode.fraOgMed;
  }

  // Opplysningsperioden har start, men ingen slutt, rettighetsperiode har en slutt
  if (
    opplysningsperiode.gyldigFraOgMed &&
    !opplysningsperiode.gyldigTilOgMed &&
    rettighetsperiode.tilOgMed
  ) {
    // Opplysningsperioden starter etter eller samtidig som rettighetsperiodens start
    return opplysningsperiode.gyldigFraOgMed >= rettighetsperiode.fraOgMed;
  }
  // Opplysningsperioden har start, men ingen slutt, rettighetsperiode har ingen slutt
  if (
    !rettighetsperiode.tilOgMed &&
    opplysningsperiode.gyldigFraOgMed &&
    !opplysningsperiode.gyldigTilOgMed
  ) {
    // Opplysningsperioden starter etter eller samtidig som rettighetsperiodens start
    return opplysningsperiode.gyldigFraOgMed >= rettighetsperiode.fraOgMed;
  }

  // Opplysningsperioden har ikke start, men har slutt, rettighetsperiode har en slutt
  if (
    !opplysningsperiode.gyldigFraOgMed &&
    opplysningsperiode.gyldigTilOgMed &&
    rettighetsperiode.tilOgMed
  ) {
    // Opplysningsperioden må slutte før eller samtidig som rettighetsperioden
    return opplysningsperiode.gyldigTilOgMed <= rettighetsperiode.tilOgMed;
  }

  // Opplysningsperioden har ikke start, men har slutt, rettighetsperiode har ingen slutt
  if (
    !rettighetsperiode.tilOgMed &&
    !opplysningsperiode.gyldigFraOgMed &&
    opplysningsperiode.gyldigTilOgMed
  ) {
    // Opplysningsperioden må stoppe etter eller samtidig som rettighetsperiodens start
    return opplysningsperiode.gyldigTilOgMed >= rettighetsperiode.fraOgMed;
  }

  // Opplysningsperioden har start og slutt, rettighetsperiode har ikke en slutt
  if (
    !rettighetsperiode.tilOgMed &&
    opplysningsperiode.gyldigFraOgMed &&
    opplysningsperiode.gyldigTilOgMed
  ) {
    // Opplysningsperioden må starte etter eller samtidig som rettighetsperiodens start
    return opplysningsperiode.gyldigFraOgMed >= rettighetsperiode.fraOgMed;
  }

  // Opplysningen gjelder fra tidenes morgen og varer til evig tid
  return true;
}

export function hentPerioderForOpplysning(
  opplysninger: components["schemas"]["RedigerbareOpplysninger"][],
  opplysningTypeId: string,
  rettighetsperiode: components["schemas"]["Rettighetsperiode"],
): components["schemas"]["Opplysningsperiode"][] {
  return (
    opplysninger
      .find((opplysning) => opplysning.opplysningTypeId === opplysningTypeId)
      ?.perioder.filter((periode) =>
        erOpplysningsperiodeInnenforRettighetsperiode(rettighetsperiode, periode),
      ) || []
  );
}

export function erPrøvingsdatoInnenforPeriode(
  prøvingsdato: string,
  fraOgMed?: string | null,
  tilOgMed?: string | null,
) {
  if (fraOgMed && tilOgMed) {
    return prøvingsdato >= fraOgMed && prøvingsdato <= tilOgMed;
  }
  if (fraOgMed && !tilOgMed) {
    return prøvingsdato >= fraOgMed;
  }
  if (!fraOgMed && tilOgMed) {
    return prøvingsdato <= tilOgMed;
  }
  return true;
}

export function hentOpplysningsperiodePåPrøvingsdato(
  opplysninger: components["schemas"]["RedigerbareOpplysninger"][],
  opplysningTypeId: string,
  prøvingsdato: string,
): components["schemas"]["Opplysningsperiode"] | undefined {
  const perioder = opplysninger
    .find((opplysning) => opplysning.opplysningTypeId === opplysningTypeId)
    ?.perioder.filter((periode) =>
      erPrøvingsdatoInnenforPeriode(prøvingsdato, periode.gyldigFraOgMed, periode.gyldigTilOgMed),
    );
  if (perioder && perioder.length > 1) {
    logger.warn(
      `hentOpplysningsperiodePåPrøvingsdato: Flere opplysningsperioder funnet på prøvingsdato for opplysningTypeId: ${opplysningTypeId}`,
    );
  }
  return perioder && perioder.length > 0 ? perioder[0] : undefined;
}

export function formaterOpplysningFormål(formål: components["schemas"]["Formål"]): string {
  switch (formål) {
    case "Legacy":
      return "Arena";
    case "Bruker":
      return "Søknad";
    case "Register":
      return "Register";
    case "Regel":
      return "Regelmotor";

    default:
      return "Ukjent";
  }
}

export function skalViseOpplysning(
  opplysning:
    | components["schemas"]["RedigerbareOpplysninger"]
    | components["schemas"]["Opplysninger"],
  visArvedeOpplysninger: boolean,
) {
  if (isRedigerbareOpplysninger(opplysning) && !opplysning.synlig) {
    return false;
  }

  const harVisbarePerioder =
    opplysning.perioder.filter((periode) => skalVisePeriode(periode, visArvedeOpplysninger))
      .length > 0;

  return harVisbarePerioder;
}

export function skalVisePeriode(
  periode: components["schemas"]["Opplysningsperiode"],
  visArvedeOpplysninger: boolean,
) {
  return periode.opprinnelse === "Ny" || (visArvedeOpplysninger && periode.opprinnelse === "Arvet");
}
