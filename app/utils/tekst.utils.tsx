export function storForbokstavIHvertOrd(value?: string | null): string {
    if (!value) {
        return '';
    }

    const ord = value.split(' ');
    const ordMedStorForbokstav = ord.map((ord) => storForbokstav(ord));
    return ordMedStorForbokstav.join(' ');
}

export function storForbokstav(value: string): string {
    return value.charAt(0).toUpperCase().concat(value.slice(1).toLowerCase());
}

export function storForbokstavOgMellomromForUnderstrek(value: string): string {
    value = value.replace(/_/g, ' ');
    return value.charAt(0).toUpperCase().concat(value.slice(1).toLowerCase());
}

export function formaterTilNok(sum: number | null | undefined): string {
    if (sum === null || sum === undefined) {
        return '';
    }
    return `${sum.toLocaleString(`nb-NO`, {
        style: 'currency',
        currency: 'NOK',
        trailingZeroDisplay: 'stripIfInteger'
    } as Intl.NumberFormatOptions & { trailingZeroDisplay: string })}`;
}

type FormaterTilGOptions = {
    antallDesimaler: number;
};

export function formaterTilG(sum: number, options?: FormaterTilGOptions): string {
    const antallDesimaler = options?.antallDesimaler ?? 3;
    const toDesimalerString = sum.toLocaleString('no-NB', {
        style: 'decimal',
        maximumFractionDigits: antallDesimaler,
        minimumFractionDigits: antallDesimaler,
        trailingZeroDisplay: 'stripIfInteger',
    } as Intl.NumberFormatOptions & { trailingZeroDisplay: string });

    return `${toDesimalerString} G`;
}

export function formaterTilProsent(sum?: number | null): string {
    if (sum === null) {
        return '';
    }
    return `${sum} %`;
}

export function formaterFaktaNok(verdi: string | null | undefined): string {
    if (verdi == null) return '—';
    const tall = parseInt(verdi, 10);
    return isNaN(tall) ? '—' : formaterTilNok(tall);
}

export function jaNeiEllerBlank(verdi: string | null | undefined): string {
    if (verdi === 'J') return 'Ja';
    if (verdi === 'N') return 'Nei';
    return '—';
}
