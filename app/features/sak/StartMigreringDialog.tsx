import {BodyShort, Button, Dialog, Table} from "@navikt/ds-react";
import {
    type ActionFunctionArgs,
    Form,
    type LoaderFunctionArgs,
    useActionData,
    useLoaderData,
    useNavigate,
    useNavigation
} from "react-router";
import {handleActions} from "~/features/handle-actions";
import invariant from "tiny-invariant";
import {unleash} from "~/utils/unleash.server";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: LoaderFunctionArgs) {
    invariant(params.sakId, "Mangler sak id")
    invariant(params.personId, "Mangler person id")

    return {
        personId: params.personId,
        sakId: params.sakId,
        kanStarteMigrering: unleash.isEnabled("dp-migrering.start-migrering"),
    };
}

export default function StartMigreringDialog() {

    const {sakId, kanStarteMigrering} = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const opplysninger = actionData && "opplysninger" in actionData ? actionData.opplysninger : undefined;

    const navigate = useNavigate();
    const navigation = useNavigation();


    const onCancel = () => {
        navigate(`/person/4886346/saker/${sakId}`);
    }

    return (
        <Dialog open
                onOpenChange={(open) => {
                    if (!open) {
                        onCancel();
                    }
                }}
                size="medium">
            <Dialog.Popup width="large">
                <Form method="post" style={{display: "contents"}}>
                    <input hidden={true} readOnly={true} name="_action" value="migrer-sak"/>

                    <Dialog.Header>
                        <Dialog.Title>Migrer sak</Dialog.Title>
                        <Dialog.Description>
                            {opplysninger && opplysninger.length > 0 && (
                                <>
                                    <BodyShort>Følgende opplysninger vil bli migrert:</BodyShort>
                                </>
                            )}
                            {!opplysninger && (
                                <>
                                    <BodyShort>
                                        Migrer saken for videre behandling i DP-Sak
                                    </BodyShort>
                                </>
                            )}
                        </Dialog.Description>
                    </Dialog.Header>
                    <Dialog.Body>
                        {!opplysninger && (
                            <BodyShort>
                                Her må det stå noe smart!!! 🧐
                            </BodyShort>
                        )}
                        {opplysninger && opplysninger.length > 0 && (
                            <>
                                <Table>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell scope="col">Opplysning</Table.HeaderCell>
                                            <Table.HeaderCell scope="col">Verdi</Table.HeaderCell>
                                            <Table.HeaderCell scope="col">Gyldig fra og med</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {opplysninger.map((opplysning, index) => (
                                            <Table.Row key={opplysning.uuid ?? index}>
                                                <Table.HeaderCell scope="row">{opplysning.navn}</Table.HeaderCell>
                                                <Table.DataCell>{opplysning.verdi}</Table.DataCell>
                                                <Table.DataCell>{opplysning.gyldigFraOgMed}</Table.DataCell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table>
                            </>
                        )}
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.CloseTrigger>
                            <Button onClick={onCancel}>Lukk</Button>
                        </Dialog.CloseTrigger>
                        <Button variant="primary" disabled={!kanStarteMigrering || opplysninger !== undefined}
                                loading={navigation.state !== "idle"}>
                            Start migrering
                        </Button>
                    </Dialog.Footer>
                </Form>
            </Dialog.Popup>
        </Dialog>
    );
}