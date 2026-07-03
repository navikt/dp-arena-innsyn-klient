import {useMemo, useState} from "react";
import type {components} from "../../openapi/arena-sak-innsyn-typer";
import {BodyShort, HStack, Label, Switch, VStack} from "@navikt/ds-react";
import {FieldValue} from "~/components/field-value/field-value";
import {formaterFaktaDato} from "~/utils/dato.utils";
import {BeregningSeksjon} from "~/components/vedtak-detaljer/beregning-seksjon";
import {SatsSeksjon} from "~/components/vedtak-detaljer/sats-seksjon";
import {Vilkar} from "~/components/vedtak-detaljer/vilkar";


interface IProps {
    vedtak: components["schemas"]["ArenaVedtakMedDetaljerResponse"];
    relatertVedtak: components["schemas"]["ArenaVedtakMedDetaljerResponse"] | null;
}

export function Vedtakdetaljer({vedtak, relatertVedtak}: IProps): React.ReactElement {
    const faktaMap = useMemo(() => new Map(vedtak.fakta.map((f) => [f.kode, f])), [vedtak.vedtakId]);
    // Bygg alle oppslag for relatert vedtak én gang. Gating på visEndringer skjer i de avledede verdiene under.
    const relatert = useMemo(() => {
        if (relatertVedtak == null) return null;
        return {
            faktaMap: new Map(relatertVedtak.fakta.map((f) => [f.kode, f])),
            // andreYtelserMap: new Map(relatertVedtak.andreYtelser.map((y) => [y.type, y])),
            // institusjonOpphold: relatertVedtak.institusjonOpphold ?? null,
        };
    }, [relatertVedtak]);

    const [visEndringer, setVisEndringer] = useState(true);

    const relatertFaktaMap = visEndringer ? (relatert?.faktaMap ?? null) : null;
    // const relatertAndreYtelserMap = visEndringer ? (relatert?.andreYtelserMap ?? null) : null;
    // // undefined = ingen sammenlikning aktiv. null = relatert vedtak hadde ingen institusjon (marker alle felt).
    // const relatertInstitusjonOpphold = visEndringer ? relatert?.institusjonOpphold : undefined;

    function erEndret(verdi: string | null | undefined, relatertVerdi: string | null | undefined): boolean {
        if (relatertVedtak == null || !visEndringer) return false;
        return verdi !== relatertVerdi;
    }

    function erFaktaEndret(kode: string): boolean {
        if (relatertFaktaMap == null) return false;
        return faktaMap.get(kode)?.verdi !== relatertFaktaMap.get(kode)?.verdi;
    }

    function getNavn(navn: string | null | undefined): string {
        if (navn == null) {
            return '—';
        }
        if (navn === 'GRENSESN') {
            return 'Automatisk';
        }
        return navn;
    }

    const vedtaksdatoFormatert = formaterFaktaDato(faktaMap.get('INNVF')?.verdi);

    return (
        <VStack gap="space-32" marginInline="space-32" marginBlock="space-8">
            <HStack gap="space-16">
                <Label size="medium">Vedtak {vedtak.rettighetnavn}</Label>
                {vedtaksdatoFormatert != null && <BodyShort size="medium">{vedtaksdatoFormatert}</BodyShort>}
            </HStack>
            {relatertVedtak != null && (
                <HStack gap="space-32">
                    <FieldValue label="Endring av vedtak nr." value={relatertVedtak.lopenrvedtak?.toString() || "n/a"}/>
                    <Switch onClick={() => setVisEndringer(!visEndringer)} checked={visEndringer}>
                        Marker endringer
                    </Switch>
                </HStack>
            )}
            <HStack gap="space-32" wrap>
                {/*{vedtak.rettighetkode === 'AAP' && (*/}
                    <>
                        <FieldValue
                            label="Gjelder fra"
                            value={formaterFaktaDato(faktaMap.get('FDATO')?.verdi) ?? '—'}
                            isChanged={erFaktaEndret('FDATO')}
                        />
                        <FieldValue
                            label="Justert fra-dato"
                            value={formaterFaktaDato(faktaMap.get('AAPJUSTFD')?.verdi) ?? '—'}
                            isChanged={erFaktaEndret('AAPJUSTFD')}
                        />
                        <FieldValue
                            label="Opprinnelig til-dato"
                            value={formaterFaktaDato(faktaMap.get('OPPRTDATO')?.verdi) ?? '—'}
                            isChanged={erFaktaEndret('OPPRTDATO')}
                        />
                        <FieldValue
                            label="Gjelder til og med"
                            value={formaterFaktaDato(faktaMap.get('TDATO')?.verdi) ?? '—'}
                            isChanged={erFaktaEndret('TDATO')}
                        />
                    </>
                {/*)}*/}
                <FieldValue
                    label="Saksbehandler"
                    value={getNavn(vedtak.saksbehandler)}
                    isChanged={erEndret(vedtak.saksbehandler, relatertVedtak?.saksbehandler)}
                />
                <FieldValue
                    label="Beslutter"
                    value={getNavn(vedtak.beslutter)}
                    isChanged={erEndret(vedtak.beslutter, relatertVedtak?.beslutter)}
                />
            </HStack>
            {/*{vedtak.rettighetkode === 'AAP' && (*/}
            <>
                <SatsSeksjon faktaMap={faktaMap} relatertFaktaMap={relatertFaktaMap}/>
                <BeregningSeksjon faktaMap={faktaMap} relatertFaktaMap={relatertFaktaMap}/>
                {/*<ForholdTilAndreYtelserSeksjon*/}
                {/*    andreYtelser={vedtak.andreYtelser}*/}
                {/*    relatertAndreYtelserMap={relatertAndreYtelserMap}*/}
                {/*/>*/}
                {/*<InstitusjonSeksjon*/}
                {/*    institusjonOpphold={vedtak.institusjonOpphold ?? null}*/}
                {/*    relatertInstitusjonOpphold={relatertInstitusjonOpphold}*/}
                {/*/>*/}
            </>
            {/*)}*/}
            <Vilkar vedtak={vedtak}/>
        </VStack>
    );
}