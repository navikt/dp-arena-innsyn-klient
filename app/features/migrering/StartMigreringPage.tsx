import {
    Accordion,
    Box,
    Button,
    Checkbox,
    DatePicker,
    Detail,
    Heading,
    HGrid,
    HStack,
    Label,
    Page,
    useDatepicker,
    VStack
} from "@navikt/ds-react";
import {useForm} from "@rvf/react-router";
import {validerStartMigrering} from "~/utils/validering.util";
import {type ActionFunctionArgs, Form, useActionData, useLoaderData} from "react-router";
import {handleActions} from "~/features/handle-actions";
import {format} from "date-fns";
import {useMigreringshendelser} from "~/features/migrering/use-migreringshendelser";
import {Migreringshendelse} from "~/features/migrering/components/Migreringshendelse";
import {formaterTilNorskDato} from "~/utils/dato.utils";
import invariant from "tiny-invariant";


export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params}: ActionFunctionArgs) {
    invariant(params.sakId, "sakId is required");

    return {
        sakId: params.sakId
    }
}

export default function StartMigreringPage() {

    const actionData = useActionData<typeof action>();
    const {sakId} = useLoaderData<typeof loader>();
    const migreringResponse = actionData && "migreringId" in actionData
        ? actionData
        : undefined;
    const migreringId = migreringResponse?.migreringId;

    const erMigrert = migreringResponse !== undefined;

    const {connected, hendelser, feil} = useMigreringshendelser(migreringResponse?.migreringId);

    const startMigreringForm = useForm({
        schema: validerStartMigrering(),
        method: "post",
        defaultValues: {
            simulering: undefined,
            migreringsTidspunkt: new Date().toISOString().substring(0, 10)
        },
    });

    const {datepickerProps, inputProps, selectedDay} = useDatepicker({
        defaultSelected: new Date(),
        fromDate: new Date(),
        allowTwoDigitYear: false,
    });

    return (
        <Page.Block as={"main"} className={"m-20 w-1/2 justify-self-center h-fit"}>
            <VStack gap={"space-16"}>
                <Heading size="medium" level="2">
                    Migrer sak {sakId}
                </Heading>
                <Form  {...startMigreringForm.getFormProps()}>
                    <input hidden={true} readOnly={true} name="_action" value="migrer-sak"/>
                    <input
                        type="hidden"
                        name="migreringsTidspunkt"
                        value={selectedDay ? format(selectedDay, "yyyy-MM-dd") : ""}
                    />
                    <Box background={"neutral-soft"}
                         borderColor="brand-blue"
                         padding="space-16"
                         borderWidth="2"
                         borderRadius="12">
                        <HStack gap={"space-8"} justify={"space-between"} align={"center"}>
                            <HStack gap={"space-16"} align={"center"}>
                                <Checkbox name="simulering" value="true" disabled={erMigrert}>
                                    Simuler migrering
                                </Checkbox>
                                <DatePicker {...datepickerProps} >
                                    <DatePicker.Input
                                        disabled={erMigrert}
                                        {...inputProps}
                                        label="Migrerings tidspunkt"
                                        error={startMigreringForm.error("migreringsTidspunkt")}
                                        description="Format: dd.mm.åååå"
                                        hideLabel
                                        size={'small'}
                                    />
                                </DatePicker>
                            </HStack>
                            <Button type="submit" disabled={erMigrert} loading={startMigreringForm.formState.submitStatus === 'submitting'}>Start migrering</Button>
                        </HStack>
                    </Box>
                </Form>
                {migreringResponse && (
                    <Box background={"neutral-soft"}
                         borderColor="brand-blue"
                         padding="space-16"
                         borderWidth="2"
                         borderRadius="12">
                        <HGrid gap={"space-8"} columns={4}>
                            <VStack gap={"space-4"} align={"start"}>
                                <Label>Sak Id</Label>
                                <Detail>{migreringResponse.sakId}</Detail>
                            </VStack>
                            <VStack gap={"space-4"} align={"start"}>
                                <Label>Migrering Id</Label>
                                <Detail>{migreringResponse.migreringId}</Detail>
                            </VStack>
                            <VStack gap={"space-4"} align={"start"}>
                                <Label>Inititert Av</Label>
                                <Detail>{migreringResponse.initiertAv}</Detail>
                            </VStack>
                            <VStack gap={"space-4"} align={"start"}>
                                <Label>Migrerings Tidspunkt</Label>
                                <Detail>{formaterTilNorskDato(migreringResponse.migreringsTidspunkt, true)}</Detail>
                            </VStack>
                        </HGrid>
                    </Box>
                )}
                {migreringId && (
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
                                        key={`${migreringId}:${hendelse.id ?? `uten-id-${index}`}`}
                                        hendelse={hendelse}
                                    />
                                ))}
                            </Accordion>
                        )}
                    </Box>
                )}
            </VStack>
        </Page.Block>
    )
}