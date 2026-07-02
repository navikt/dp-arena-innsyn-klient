export function formaterTallMedTusenSeperator(verdi: string | number): string {
  const nummer = typeof verdi === "number" ? verdi : parseFloat(verdi);

  return new Intl.NumberFormat("no-NO").format(nummer);
}
