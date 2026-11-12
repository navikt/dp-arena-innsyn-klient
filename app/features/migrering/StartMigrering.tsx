import {BodyShort, Box, Button, Checkbox, DatePicker, HStack, Label, useDatepicker, VStack} from "@navikt/ds-react";
import {Form} from "react-router";
import {format} from "date-fns";
import {useForm} from "@rvf/react-router";
import {validerStartMigrering} from "~/utils/validering.util";


export default function StartMigrering({sakId}: { sakId: string }) {
    // const actionData = useActionData<typeof action>();
    // const {sakId} = useLoaderData<typeof loader>();
    // const migreringResponse = actionData && "migreringId" in actionData
    //     ? actionData
    //     : undefined;
    // const migreringId = migreringResponse?.migreringId;

    // const erMigrert = migreringResponse !== undefined;

    // const {connected, hendelser, feil} = useMigreringshendelser(migreringResponse?.migreringId);

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
        <VStack padding={"space-16"}>
            <Form  {...startMigreringForm.getFormProps()}>
                <input hidden={true} readOnly={true} name="_action" value="migrer-sak"/>
                <input
                    type="hidden"
                    name="migreringsTidspunkt"
                    value={selectedDay ? format(selectedDay, "yyyy-MM-dd") : ""}
                />
                <Box background={"neutral-soft"}
                     borderColor="brand-blue"
                     padding="space-8"
                     borderWidth="2"
                     borderRadius="12">
                    <HStack gap={"space-32"} justify={"space-between"} align={"center"}>
                        <HStack gap={"space-32"} align={"center"}>
                            <Box borderWidth={"0 1 0 0"} paddingInline="space-16" >

                            <HStack gap={"space-8"} align={"center"}>
                                <Label>Sak Id:</Label>
                                <BodyShort>{sakId}</BodyShort>
                            </HStack>
                            </Box>
                            <HStack gap={"space-12"} align={"center"}>

                                <Checkbox name="simulering" value="true">
                                    Simuler migrering
                                </Checkbox>
                                <DatePicker {...datepickerProps} >
                                    <DatePicker.Input
                                        {...inputProps}
                                        label="Migrerings tidspunkt"
                                        error={startMigreringForm.error("migreringsTidspunkt")}
                                        description="Format: dd.mm.åååå"
                                        hideLabel
                                        size={'small'}
                                    />
                                </DatePicker>
                            </HStack>
                        </HStack>
                        <Button type="submit" loading={startMigreringForm.formState.submitStatus === 'submitting'} size={"small"}>Start
                            migrering</Button>
                    </HStack>
                </Box>
            </Form>
        </VStack>
    );
}