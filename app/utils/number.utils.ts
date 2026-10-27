export function formaterTallMedTusenSeperator(verdi: string | number): string {
  const nummer = typeof verdi === "number" ? verdi : parseFloat(verdi);

  return new Intl.NumberFormat("no-NO").format(nummer);
}

export function fjernTusenskille(verdi: string): string {
  return verdi.replace(/[ \u00a0\u202f]/g, "");
}

export function formaterBelopUnderInntasting(verdi: string): string {
  const utenTusenskille = fjernTusenskille(verdi);
  if (!/^-?\d*(?:[.,]\d*)?$/.test(utenTusenskille)) {
    return verdi;
  }

  const [heltall, desimaler] = utenTusenskille.replace(".", ",").split(",");
  const gruppert = heltall.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return desimaler === undefined ? gruppert : `${gruppert},${desimaler}`;
}
