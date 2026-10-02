import {HGrid} from '@navikt/ds-react';
import type {components} from "../../../../../openapi/arena-sak-innsyn-typer";
import {SeksjonHeading} from "~/features/sak/components/vedtak-detaljer/SeksjonHeading";
import {VilkarListe} from "~/features/sak/components/vedtak-detaljer/VilkarListe";


type Props = {
    vedtak: components['schemas']['ArenaVedtakMedDetaljerResponse'];
};

export function Vilkar({vedtak}: Props): React.ReactElement {
    return (
        <div>
            <SeksjonHeading tittel="Vilkår"/>
            <HGrid columns={2} gap="space-64">
                <VilkarListe vilkarsvurderinger={vedtak.vilkårsvurderinger}/>
            </HGrid>
        </div>
    );
}
