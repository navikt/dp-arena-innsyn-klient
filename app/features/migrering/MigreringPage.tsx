import {type ActionFunctionArgs, Outlet, useLoaderData} from "react-router";
import {handleActions} from "~/features/handle-actions";
import invariant from "tiny-invariant";
import StartMigrering from "~/features/migrering/StartMigrering";
import {PersonBoks} from "~/features/person/components/person-boks/PersonBoks";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params}: ActionFunctionArgs) {
    invariant(params.sakId, "sakId is required");

    return {
        sakId: params.sakId,
        person: {etternavn: "test", fodselsnummer: "12345678901", fornavn: "test", personId: 123}
    }
}

export default function MigreringPage() {
    const { sakId, person } = useLoaderData<typeof loader>();
    return (
        <>
            <PersonBoks person={person}/>
            <StartMigrering sakId={sakId}/>
            <div className={`main flex gap-4`}>
                <Outlet/>
            </div>
        </>
    )
}

