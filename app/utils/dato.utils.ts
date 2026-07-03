import { format, parse } from "date-fns";
import { nb } from "date-fns/locale";

/**
 * Formaterer en dato-streng til norsk datoformat.
 *
 * @param inputDato - En `Date`-instans eller en streng i (ISO-format, f.eks. `"2021-01-31T12:00:00"`).
 * @param medKlokkeslett - Om klokkeslett skal inkluderes i formatet (valgfritt).
 * @returns En dato som streng i formatet `dd.MM.yyyy` eller `dd.MM.yyyy - HH:mm:ss`.
 *
 * @throws Kaster en feil hvis dato-strengen ikke kan konverteres til en gyldig `Date`.
 */
export function formaterTilNorskDato(inputDato: Date | string, medKlokkeslett?: boolean) {
  const dato = inputDato instanceof Date ? inputDato : new Date(inputDato);

  if (isNaN(dato.getTime())) {
    throw new Error(
      `Ugyldig datoformat: ${inputDato}, forventet ISO-streng, f.eks. '2021-01-31T12:00:00'.`,
    );
  }

  if (medKlokkeslett) {
    // 31.01.2021 - 12:00:00
    return format(dato, "dd.MM.yyyy - HH:mm:ss", {
      locale: nb,
    });
  }

  // 31.01.2021
  return format(dato, "dd.MM.yyyy", {
    locale: nb,
  });
}

export type SortOrder = 'ASC' | 'DESC';

// export function dateComperator(
//     date1: Date | null | undefined,
//     date2: Date | null | undefined,
//     sortOrder: SortOrder = 'ASC'
// ): number {
//   if (date1 == null && date2 == null) {
//     return 0;
//   }
//
//   if (date1 == null) {
//     return 1;
//   }
//
//   if (date2 == null) {
//     return -1;
//   }
//
//   return sortOrder === 'DESC' ? compareDesc(date1, date2) : compareAsc(date1, date2);
// }
//
// export function parseISOorNull(dateString: string | null | undefined): Date | null {
//   if (dateString == null) {
//     return null;
//   }
//   return parseISO(dateString);
// }

export function norsktDatoformat(date: Date | string): string {
  return format(date, 'dd.MM.yyyy', { locale: nb });
}

export function norsktDatoformatMedTid(dato: Date | string): string {
  return format(dato, 'dd.MM.yyyy HH:mm:ss', { locale: nb });
}

export function parseFaktaDato(dateString: string): Date;
export function parseFaktaDato(dateString: string | null | undefined): Date | null;
export function parseFaktaDato(dateString: string | null | undefined): Date | null {
  if (dateString == null) {
    return null;
  }
  return parse(dateString, 'dd-MM-yyyy', new Date());
}

export function formaterFaktaDato(dateString: string | null | undefined): string | null {
  const parsed = parseFaktaDato(dateString);
  return parsed != null ? norsktDatoformat(parsed) : null;
}

