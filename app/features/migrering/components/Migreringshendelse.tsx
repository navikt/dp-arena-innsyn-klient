import {Accordion, BodyShort, Button, List, Table, Tag} from "@navikt/ds-react";
import {z} from "zod";
import {useFetcher} from "react-router";
import type {loader} from "~/features/migrering/hendelse";
import type {Migreringshendelse as Hendelse} from "~/features/migrering/use-migreringshendelser";
import type {MigreringHendelseResponse} from "~/features/migrering/clients/hendelse-client.server";
import {lesHendelsesdata, MigreringshendelseRawVisningDialog} from "~/features/migrering/components/MigreringshendelseRawVisningDialog";


export function Migreringshendelse({hendelse}: { hendelse: Hendelse }) {
    const fetcher = useFetcher<typeof loader>();
    const laster = fetcher.state !== "idle";
    const innhold = fetcher.data?.hendelse ? lesHendelsesdata(fetcher.data.hendelse.data) : undefined;

    function hentDetaljer() {
        if (hendelse.id !== undefined) {
            void fetcher.load(`/api/migrering/hendelse/${hendelse.id}`);
        }
    }

    return (
        <Accordion.Item onOpenChange={(open) => {
            if (open && fetcher.data === undefined && !laster) {
                hentDetaljer();
            }
        }}>
            <Accordion.Header>
                <HendelseTag hendelse={hendelse}/>
            </Accordion.Header>
            <Accordion.Content>
                <>
                    {hendelse.id === undefined && <p role="alert">Hendelsen mangler en ID. Kan ikke hente detaljer.</p>}
                    {laster && <p role="status">Henter hendelsen.</p>}
                    {fetcher.data?.feil && (
                        <>
                            <p role="alert">{fetcher.data.feil}</p>
                            <Button type="button" size="small" variant="secondary" onClick={hentDetaljer} disabled={laster}>
                                Prøv igjen
                            </Button>
                        </>
                    )}
                    {innhold?.feil && <p role="alert">{innhold.feil}</p>}
                    {innhold && <MigreringshendelseRawVisningDialog tekst={innhold.tekst}/>}
                    <Table size="small">
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell/>
                                <Table.HeaderCell scope="col">MeldingId</Table.HeaderCell>
                                <Table.HeaderCell scope="col">Tidspunkt</Table.HeaderCell>
                                <Table.HeaderCell scope="col">Opprinnelse</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {fetcher.data?.hendelse &&
                                (
                                    <Table.ExpandableRow key={hendelse.id}
                                                         content={innhold && !innhold.feil
                                                             ? <Tilleggsinfo hendelse={fetcher.data.hendelse} data={innhold.data}/>
                                                             : null}
                                                         expandOnRowClick
                                    >
                                        <Table.HeaderCell
                                            scope="row">{fetcher.data.hendelse.meldingId}</Table.HeaderCell>
                                        <Table.HeaderCell
                                            scope="row">{fetcher.data.hendelse.tidspunkt}</Table.HeaderCell>
                                        <Table.HeaderCell scope="row">
                                            <Tag variant={"moderate"} size={"xsmall"} data-color={"neutral"}>
                                                {fetcher.data.hendelse.opprinnelse.toLocaleUpperCase()}
                                            </Tag>
                                        </Table.HeaderCell>
                                    </Table.ExpandableRow>
                                )
                            }
                        </Table.Body>
                    </Table>

                </>
            </Accordion.Content>
        </Accordion.Item>
    );
}

function HendelseTag({hendelse}: { hendelse: Hendelse }) {
    switch (hendelse.hendelse) {
        case "MIGRERING_AVBRUTT":
            return <Tag variant="moderate" data-color={"warning"} size={"small"}>{hendelse.hendelse}</Tag>;
        default:
            return <Tag variant="moderate" data-color={"success"}
                        size={"small"}>{hendelse.hendelse ?? "Ukjent hendelse"}</Tag>;
    }
}

function Tilleggsinfo({hendelse, data}: { hendelse: MigreringHendelseResponse; data: unknown }) {
    switch (hendelse.hendelse) {
        case "MIGRERING_STARTET_MED_MANGLENDE_OPPLYSNINGER":
            return <TilleggsinfoManglerOpplysninger data={data}/>;
        case "MIGRERING_AVBRUTT":
            return <TilleggsinfoAvbrutt data={data}/>;
        default:
            return <BodyShort size={"small"}>Ingen tilleggsinformasjon tilgjengelig for denne hendelsen.</BodyShort>;
    }
}

function TilleggsinfoWrap({children}: { children: React.ReactNode }) {
    return (
        <Table size="small">
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell scope="col">Nøkkel</Table.HeaderCell>
                    <Table.HeaderCell scope="col">Verdi</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {children}
            </Table.Body>
        </Table>
    );
}

const manglendeOpplysningerSchema = z.object({
    manglendeOpplysninger: z.array(z.object({navn: z.string(), uuid: z.string()})),
    opplysninger: z.array(z.object({navn: z.string(), id: z.string()})),
});

function TilleggsinfoManglerOpplysninger({data}: {data: unknown}) {
    const resultat = manglendeOpplysningerSchema.safeParse(data);
    if (!resultat.success) {
        return <p role="alert">Hendelsen har et ukjent format. Se den opprinnelige meldingen.</p>;
    }
    const opplysninger = resultat.data;
    return (
        <TilleggsinfoWrap>
            <Table.Row>
                <Table.HeaderCell>Manglende opplysninger</Table.HeaderCell>
                <Table.DataCell>
                    <List as="ul" size={"small"}>
                        {opplysninger.manglendeOpplysninger.map((opplysning, index) => (
                            <List.Item key={index} title={opplysning.navn}>
                                {opplysning.uuid}
                            </List.Item>
                        ))}
                    </List>
                </Table.DataCell>
            </Table.Row>
            <Table.Row>
                <Table.HeaderCell>Opplysninger</Table.HeaderCell>
                <Table.DataCell>
                    {opplysninger.opplysninger.length === 0 ? <BodyShort size={"small"}>Ingen opplysninger</BodyShort> :
                        <List as="ul" size={"small"}>
                            {opplysninger.opplysninger.map((opplysning, index) => (
                                <List.Item key={index} title={opplysning.navn}>
                                    {opplysning.id}
                                </List.Item>
                            ))}
                        </List>}
                </Table.DataCell>
            </Table.Row>
        </TilleggsinfoWrap>
    );
}

function TilleggsinfoAvbrutt({data}: {data: unknown}) {
    const resultat = z.object({årsak: z.json()}).safeParse(data);
    if (!resultat.success) {
        return <p role="alert">Hendelsen har et ukjent format. Se den opprinnelige meldingen.</p>;
    }
    return (
        <Table size="small">
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell scope="col">Nøkkel</Table.HeaderCell>
                    <Table.HeaderCell scope="col">Verdi</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                <Table.Row>
                    <Table.HeaderCell>Årsak</Table.HeaderCell>
                    <Table.DataCell>
                      <pre style={{
                          whiteSpace: "pre-wrap",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                      }}>{JSON.stringify(resultat.data.årsak, null, 2)}</pre>
                    </Table.DataCell>
                </Table.Row>
            </Table.Body>
        </Table>
    );
}
