import {type ActionFunctionArgs, type LoaderFunctionArgs, Outlet, useLoaderData} from "react-router";
import {handleActions} from "~/features/handle-actions";
import {hentPerson} from "~/features/person/clients/person-client.server";
import invariant from "tiny-invariant";
import {PersonBoks} from "~/features/person/components/person-boks/PersonBoks";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: LoaderFunctionArgs) {
    invariant(params.personId, "Mangler person id")
    return await hentPerson(request, Number(params.personId))

}

export default function Person() {
    const person = useLoaderData<typeof loader>()

    return (
        <>
            <PersonBoks person={person}/>
            <div className={`main flex gap-4`}>
                <Outlet/>
            </div>
        </>
    )
}