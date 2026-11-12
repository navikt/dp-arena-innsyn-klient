import {Accordion, Box, Detail, Heading, HStack, Label, Page, Tag, VStack} from "@navikt/ds-react";
import {type ActionFunctionArgs, useLoaderData} from "react-router";
import {handleActions} from "~/features/handle-actions";
import {useMigreringshendelser} from "~/features/migrering/use-migreringshendelser";
import {Migreringshendelse} from "~/features/migrering/components/Migreringshendelse";
import {formaterTilNorskDato} from "~/utils/dato.utils";
import invariant from "tiny-invariant";
import {hentMigrering} from "~/features/migrering/clients/migrering-client.server";


export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: ActionFunctionArgs) {
    invariant(params.migreringId, "migreringId is required");

    const migrering = await hentMigrering(request, params.migreringId);

    return {
        migrering
    }
}

export default function MigreringDetaljerPage() {

    const {migrering} = useLoaderData<typeof loader>();


    const {connected, hendelser, feil} = useMigreringshendelser(migrering.migreringId);

    const status = hendelser.length > 0 ? hendelser[hendelser.length - 1].hendelse : migrering.status


    return (
        <Page.Block className={"card p-4"}>
            <VStack gap={"space-16"}>
                detaljer
                {/*{migreringResponse && (*/}
                <Box background={"neutral-soft"}
                     borderColor="brand-blue"
                     padding="space-16"
                     borderWidth="2"
                     borderRadius="12">
                    <HStack gap={"space-8"} justify={"space-between"} align={"start"}>
                        <VStack gap={"space-4"} align={"start"}>
                            <Label>Sak Id</Label>
                            <Detail>{migrering.sakId}</Detail>
                        </VStack>
                        <VStack gap={"space-4"} align={"start"}>
                            <Label>Migrering Id</Label>
                            <Detail>{migrering.migreringId}</Detail>
                        </VStack>
                        <VStack gap={"space-4"} align={"start"}>
                            <Label>Inititert Av</Label>
                            <Detail>{migrering.initiertAv}</Detail>
                        </VStack>
                        <VStack gap={"space-4"} align={"start"}>
                            <Label>Migrerings Tidspunkt</Label>
                            <Detail>{formaterTilNorskDato(migrering.migreringsTidspunkt, true)}</Detail>
                        </VStack>
                        <VStack gap={"space-4"} align={"start"}>
                            <Label>Migrerings Status</Label>
                            <Tag variant={"moderate"} size={"xsmall"}
                                 data-color={status?.endsWith("AVBRUTT") ? "danger" : "success"}>
                                {status}
                            </Tag>
                        </VStack>
                        <VStack gap={"space-4"} align={"start"}>
                            <Label>Simulering</Label>
                            {migrering.simulering ? "Ja" : "Nei"}
                        </VStack>
                    </HStack>
                </Box>
                {/*)}*/}
                {/*{migreringId && (*/}
                <Box as="section" aria-label="Hendelser" background={"neutral-soft"}
                     borderColor="brand-blue"
                     padding="space-16"
                     borderWidth="2"
                     borderRadius="12">
                    <Heading size="small" level="3">
                        Status
                    </Heading>
                    <p role="status">{connected ? "Lytter etter hendelser." : "Kobler til hendelsesstrømmen."}</p>
                    {feil && <p role="alert">{feil}</p>}
                    {hendelser.length === 0 ? (
                        <p>Ingen hendelser mottatt ennå.</p>
                    ) : (
                        <Accordion size="small">
                            {hendelser.map((hendelse, index) => (
                                <Migreringshendelse
                                    key={`${migrering.migreringId}:${hendelse.id ?? `uten-id-${index}`}`}
                                    hendelse={hendelse}
                                />
                            ))}
                        </Accordion>
                    )}
                </Box>
                {/*)}*/}
            </VStack>
        </Page.Block>
    )
}