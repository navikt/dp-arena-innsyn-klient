import {type ActionFunctionArgs, Outlet, useLoaderData} from "react-router";
import {handleActions} from "~/features/handle-actions";
import invariant from "tiny-invariant";
import StartMigrering from "~/features/migrering/StartMigrering";
import {PersonBoks} from "~/features/person/components/person-boks/PersonBoks";
import {hentPerson} from "~/features/person/clients/person-client.server";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: ActionFunctionArgs) {
    invariant(params.sakId, "sakId is required");
    invariant(params.personId, "personId is required");

    const person = await hentPerson(request, Number(params.personId))


    return {
        sakId: params.sakId,
        person
    }
}

export default function MigreringPage() {
    const { sakId, person } = useLoaderData<typeof loader>();
    return (
        <>
            <PersonBoks person={person}/>
            <StartMigrering sakId={sakId} person={person} />
            <div className={`main flex gap-4`}>
                <Outlet/>
            </div>
        </>
    )
}

