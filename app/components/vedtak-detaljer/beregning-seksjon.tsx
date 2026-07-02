
import { HStack, InlineMessage, Label, VStack } from '@navikt/ds-react';
import type {components} from "../../../openapi/arena-sak-innsyn-typer";
import {SeksjonHeading} from "~/components/vedtak-detaljer/seksjon-heading";
import {FieldValue} from "~/components/field-value/field-value";
import {formaterFaktaDato} from "~/utils/dato.utils";
import {formaterFaktaNok, jaNeiEllerBlank} from "~/utils/tekst.utils";


const BEREGNINGSREGEL_TEKST: Record<string, string> = {
  ORDINAER_MINSTEYTELSE: 'Minsteytelse over 25 år',
  ORDINAER_OVER_6G: 'Grunnlaget overstiger 6G',
  MANUELL_UNDER_6G: 'Manuelt fastsatt grunnlag under 6 G',
  ORDINAER_ETTAAR: '§ 11-19 Inntekt siste år',
  YRKESSKADE_UNDER_6G: '§ 11-19/11-22 Grunnlaget er beregnet med yrkeskadefordel - under 6G',
  MINSTEYTELSE_U25: 'Minsteytelse under 25 år',
  MANUELL_OVER_6G: 'Manuelt fastsatt grunnlag over 6G',
  YRKESSKADE_OVER_6G: '§ 11-19/11-22 Grunnlaget er beregnet med yrkeskadefordel - over 6G',
  ORDINAER_TREAAR: '§ 11-19 Gjennomsnitt inntekt siste 3 år',
  UNGUFOER_MINSTEYTELSE: 'Minsteytelse som ung ufør',
  ORDINAER_OVER_6G_2018: 'Grunnlaget overstiger 6G',
};

function beregningsregelTekst(kode: string | null | undefined): string {
  if (kode == null) return '—';
  return BEREGNINGSREGEL_TEKST[kode] ?? kode;
}

type Props = {
  faktaMap: Map<string, components['schemas']['ArenaVedtakfaktaResponse']>;
  relatertFaktaMap: Map<string, components['schemas']['ArenaVedtakfaktaResponse']> | null;
};

export function BeregningSeksjon({ faktaMap, relatertFaktaMap }: Props): React.ReactElement {
  const erManueltBeregnet = faktaMap.get('AGRLAGMAN')?.verdi === 'J';
  const harYrkesskade = faktaMap.get('AYRKESKADE')?.verdi === 'J';

  const overgangstilfeller = ['OVERGTAT', 'OVERGTRP', 'OVERGTTU']
    .map((kode) => faktaMap.get(kode))
    .filter((f) => f?.verdi === 'J')
    .map((f) => f!.navn)
    .join(', ');

  const relatertOvergangstilfeller = relatertFaktaMap
    ? ['OVERGTAT', 'OVERGTRP', 'OVERGTTU']
        .map((kode) => relatertFaktaMap.get(kode))
        .filter((f) => f?.verdi === 'J')
        .map((f) => f!.navn)
        .join(', ')
    : null;

  function erEndret(kode: string): boolean {
    if (relatertFaktaMap == null) return false;
    return faktaMap.get(kode)?.verdi !== relatertFaktaMap.get(kode)?.verdi;
  }

  function beregningBelopOgAarString(verdiKode: string, aarKode: string): string {
    const verdi = faktaMap.get(verdiKode)?.verdi;
    const aar = faktaMap.get(aarKode)?.verdi;

    if (verdi == null) return '—';
    if (aar == null) return formaterFaktaNok(verdi);

    return `${formaterFaktaNok(verdi)} (${aar})`;
  }

  return (
    <div>
      <SeksjonHeading
        tittel="Beregning"
        action={
          erManueltBeregnet ? (
            <InlineMessage status="warning" size="small">
              Grunnlaget er beregnet manuelt
            </InlineMessage>
          ) : undefined
        }
      />
      <VStack gap="space-16">
        <HStack gap="space-32" wrap>
          <FieldValue
            label="Tidspunkt arbeidsevnen ble nedsatt"
            value={formaterFaktaDato(faktaMap.get('AAPBERDATO')?.verdi) ?? '—'}
            isChanged={erEndret('AAPBERDATO')}
          />
          <FieldValue
            label="Beregningsregelverk"
            value={faktaMap.get('AAPBERREGL')?.verdi ?? '—'}
            isChanged={erEndret('AAPBERREGL')}
          />
        </HStack>

        {harYrkesskade && (
          <VStack gap="space-8">
            <Label size="small">Yrkesskade</Label>
            <HStack gap="space-32" wrap>
              <FieldValue
                label="Skadedato"
                value={formaterFaktaDato(faktaMap.get('YDATO')?.verdi) ?? '—'}
                isChanged={erEndret('YDATO')}
              />
              <FieldValue
                label="Yrkesskadegrad"
                value={faktaMap.get('YSKADEGRD')?.verdi != null ? `${faktaMap.get('YSKADEGRD')?.verdi}%` : '—'}
                isChanged={erEndret('YSKADEGRD')}
              />
              <FieldValue
                label="Inntekt på skadetidspunkt"
                value={formaterFaktaNok(faktaMap.get('YINNT')?.verdi)}
                isChanged={erEndret('YINNT')}
              />
            </HStack>
          </VStack>
        )}

        <VStack gap="space-8">
          <Label size="small">Inntektsgrunnlag</Label>
          <HStack gap="space-32" wrap>
            <FieldValue
              label="Siste beregningsår"
              value={beregningBelopOgAarString('INTSISTE', 'INTARSISTE')}
              isChanged={erEndret('INTSISTE')}
            />
            <FieldValue
              label="Nest siste beregningsår"
              value={beregningBelopOgAarString('INTNESTS', 'INTARNESTS')}
              isChanged={erEndret('INTNESTS')}
            />
            <FieldValue
              label="Tredje siste beregningsår"
              value={beregningBelopOgAarString('INTTREDS', 'INTARTREDS')}
              isChanged={erEndret('INTTREDS')}
            />
            <FieldValue
              label="Grunnlag for beregning"
              value={formaterFaktaNok(faktaMap.get('GRUNN')?.verdi)}
              isChanged={erEndret('GRUNN')}
            />
            <FieldValue
              label="Beregningsregel"
              value={beregningsregelTekst(faktaMap.get('BERREGEL')?.verdi)}
              isChanged={erEndret('BERREGEL')}
            />
            {overgangstilfeller && (
              <FieldValue
                label="Overgangstilfelle"
                value={overgangstilfeller || '—'}
                isChanged={relatertFaktaMap != null && overgangstilfeller !== relatertOvergangstilfeller}
              />
            )}
            {faktaMap.get('ARBPEOS')?.verdi === 'J' && (
              <FieldValue label="Arbeidsperiode fra EØS/Norden" value="Ja" isChanged={erEndret('ARBPEOS')} />
            )}
            <FieldValue
              label="Ung ufør"
              value={jaNeiEllerBlank(faktaMap.get('AUNGFOR')?.verdi)}
              isChanged={erEndret('AUNGFOR')}
            />
          </HStack>
        </VStack>
      </VStack>
    </div>
  );
}
