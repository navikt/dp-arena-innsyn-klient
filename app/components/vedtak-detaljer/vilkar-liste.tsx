import {BodyShort, HGrid, Label, VStack} from '@navikt/ds-react';
import {CheckmarkCircleIcon, XMarkOctagonIcon} from '@navikt/aksel-icons';
import styles from './vedtakdetaljer.module.css';
import type {components} from "../../../openapi/arena-sak-innsyn-typer";

type Props = {
    vilkarsvurderinger: components["schemas"]["ArenaVilkarsvurderingResponse"][];
};

const STATUSKODE_SORTERING = ['J', 'N', 'V'];

export function VilkarListe({vilkarsvurderinger}: Props): React.ReactElement {
    const sortert = vilkarsvurderinger.sort(
        (a, b) => STATUSKODE_SORTERING.indexOf(a.statuskode) - STATUSKODE_SORTERING.indexOf(b.statuskode)
    );

    return (
        <VStack gap="space-20">
            {sortert.map((vilkar) => (
                <HGrid
                    key={vilkar.vilkårsvurderingId}
                    columns="24px 1fr"
                    gap="space-16"
                    className={vilkar.statuskode === 'V' ? styles.ikkeVurdert : undefined}
                >
                    <div>
                        {vilkar.statuskode === 'J' && (
                            <CheckmarkCircleIcon aria-hidden width={24} height={24} className={styles.successIcon}/>
                        )}
                        {vilkar.statuskode === 'N' && (
                            <XMarkOctagonIcon aria-hidden width={24} height={24} className={styles.errorIcon}/>
                        )}
                    </div>
                    <div>
                        <Label size="small">{vilkar.vilkårnavn}</Label>
                        <BodyShort size="small">
                            {vilkar.statusnavn}
                            {vilkar.vurdertAv && ` – Vurdert av ${vilkar.vurdertAv}`}
                        </BodyShort>
                    </div>
                </HGrid>
            ))}
        </VStack>
    );
}
