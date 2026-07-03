import {type ActionFunctionArgs, type LoaderFunctionArgs, useLoaderData} from "react-router";
import {handleActions} from "~/server-side-actions/handle-actions";
import invariant from "tiny-invariant";
import {hentSakForPerson} from "~/models/saksbehandling.server";
import {Heading, HStack, Page, Tag, VStack} from "@navikt/ds-react";
import {VedtakTabell} from "~/routes/VedtakTabell";
import {FieldValue} from "~/components/field-value/field-value";
import {norsktDatoformat} from "~/utils/dato.utils";
import {sakStatus} from "~/routes/PersonSaksliste";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: LoaderFunctionArgs) {
    invariant(params.sakId, "Mangler sak id")
    const sak = await hentSakForPerson(request, params.sakId)
    return sak

}

export default function PersonSakDetaljer() {
    const sak = useLoaderData<typeof loader>();

    // const nyesteVedtak = sak.vedtak.sort((a, b) => b.lopenrvedtak - a.lopenrvedtak)[0];
    //
    // const startdato = pickDate(sak.vedtak.map(getFradato), 'asc');
    // const sluttdato = pickDate(
    //     sak.vedtak.map((v) => v.fakta.find((f) => f.kode === 'TDATO')?.verdi),
    //     'desc'
    // );

    const {
        dagpengePeriodeTeller,
        maxPeriodePermittertTeller,
        maxPeriodePermittertTellerFisk
    } = sak.telleverkForPerson ?? {};


    const telleverkTekst =
        sak.telleverkForPerson == null
            ? '—'
            : dagpengePeriodeTeller != null && dagpengePeriodeTeller > 0
                ? `${dagpengePeriodeTeller / 20} dager (Ordinær)`
                : maxPeriodePermittertTeller != null && maxPeriodePermittertTeller > 0
                    ? `${maxPeriodePermittertTeller / 20} dager (Permittert)`
                    : maxPeriodePermittertTellerFisk != null && maxPeriodePermittertTellerFisk > 0
                        ? `${maxPeriodePermittertTellerFisk / 20} dager (Permittert Fisk)`
                        : '0';


    return (

        <Page.Block className={"card p-4"}>
            <VStack gap="space-24">
                <HStack gap="space-20" align="center">
                    <Heading size="medium">
                        {/*Arena {nyesteVedtak?.rettighetnavn ?? ''} {sak.opprettetAar} {sak.lopenr}*/}
                        Arena {sak.opprettetAar}-{sak.lopenr}
                    </Heading>


                    {/*{startdato != null && (*/}
                    {/*    <BodyShort size="small" data-testid="sak-datoperiode">*/}
                    {/*        {norsktDatoformat(startdato)} {sluttdato != null && `– ${norsktDatoformat(sluttdato)}`}*/}
                    {/*    </BodyShort>*/}
                    {/*)}*/}
                    <HStack gap="space-8">
                        {sak.statuskode != null && (
                            <Tag variant="moderate" size="small"
                                 data-color={sakStatus(sak.statuskode)}>
                                {sak.statusnavn}
                            </Tag>
                        )}
                        {/*{sluttdato != null && <SluttdatoTag sluttdato={sluttdato} />}*/}
                    </HStack>
                </HStack>
                <div className={"card"}>

                    <VStack gap="space-32" marginInline="space-32" marginBlock="space-8">
                        <HStack gap="space-16">
                            <FieldValue
                                label="Siste utbetaling"
                                value={sak.sisteUtbetalingDato != null ? norsktDatoformat(new Date(sak.sisteUtbetalingDato)) : '—'}
                            />
                            <FieldValue label={"Gjenstående"} value={telleverkTekst}/>

                        </HStack>
                    </VStack>
                </div>
                <div className={"card"}>
                    <VStack gap="space-32" marginInline="space-32" marginBlock="space-8">


                        {/*<Nokkeltall sak={sak} />*/}
                        <VedtakTabell vedtak={sak.vedtak}/>
                    </VStack>
                </div>
            </VStack>
        </Page.Block>
    )
}
