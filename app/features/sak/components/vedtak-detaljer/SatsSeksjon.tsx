
import { HStack } from '@navikt/ds-react';
import type {components} from "../../../../../openapi/arena-sak-innsyn-typer";
import {SeksjonHeading} from "~/features/sak/components/vedtak-detaljer/SeksjonHeading";
import {FieldValue} from "~/features/sak/components/field-value/field-value";
import {formaterFaktaNok} from "~/utils/tekst.utils";


type Props = {
  faktaMap: Map<string, components['schemas']['ArenaVedtakfaktaResponse']>;
  relatertFaktaMap: Map<string, components['schemas']['ArenaVedtakfaktaResponse']> | null;
};

export function SatsSeksjon({ faktaMap, relatertFaktaMap }: Props): React.ReactElement {
  function erEndret(kode: string): boolean {
    if (relatertFaktaMap == null) return false;
    return faktaMap.get(kode)?.verdi !== relatertFaktaMap.get(kode)?.verdi;
  }

  return (
    <div>
      <SeksjonHeading tittel="Sats" />
      <HStack gap="space-32" wrap>
        <FieldValue
          label="Grunnsats"
          value={formaterFaktaNok(faktaMap.get('DAGSFSAM')?.verdi)}
          isChanged={erEndret('DAGSFSAM')}
        />
        <FieldValue
          label="Ant. barn med stønad"
          value={faktaMap.get('BARNMSTON')?.verdi ?? '—'}
          isChanged={erEndret('BARNMSTON')}
        />
        <FieldValue
          label="Dagsats med barnetillegg før samordning"
          value={formaterFaktaNok(faktaMap.get('DAGSMBFSAM')?.verdi)}
          isChanged={erEndret('DAGSMBFSAM')}
        />
        <FieldValue
          label="Dagsats med barnetillegg etter samordning"
          value={formaterFaktaNok(faktaMap.get('DAGSMBT')?.verdi)}
          isChanged={erEndret('DAGSMBT')}
        />
      </HStack>
    </div>
  );
}
