import {Box, Button, Checkbox, DatePicker, Heading, HStack, useDatepicker, VStack} from "@navikt/ds-react";
import {Form} from "react-router";
import {format} from "date-fns";
import {useForm} from "@rvf/react-router";
import {validerStartMigrering} from "~/utils/validering.util";


export default function StartMigrering() {
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
        <VStack gap={"space-16"}>
            <Heading size="medium" level="2">
                Migrer sak
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
                        <Button type="submit" loading={startMigreringForm.formState.submitStatus === 'submitting'}>Start
                            migrering</Button>
                    </HStack>
                </Box>
            </Form>
        </VStack>
    );
}