
export function finnKjonnFraFodselsnummer(fodselsnummer: string): 'KVINNE' | 'MANN' | 'UKJENT' {

    if (!/^\d{11}$/.test(fodselsnummer)) {
        return 'UKJENT';
    }

    const kjonnsSiffer = parseInt(fodselsnummer.charAt(8), 10);

    return kjonnsSiffer % 2 === 0 ? 'KVINNE' : 'MANN';
}