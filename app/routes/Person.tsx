import {type ActionFunctionArgs, type LoaderFunctionArgs, Outlet, useLoaderData} from "react-router";
import {handleActions} from "~/server-side-actions/handle-actions";
import {hentPerson} from "~/models/saksbehandling.server";
import invariant from "tiny-invariant";
import {PersonBoks} from "~/person-boks/PersonBoks";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: LoaderFunctionArgs) {
    invariant(params.personId, "Mangler person id")
    return await hentPerson(request, Number(params.personId))

}

function sakStatus(status: string | undefined): "accent" | "neutral" | "info" | "success" | "warning" | "danger" | "meta-purple" | "meta-lime" | "brand-beige" | "brand-blue" | "brand-magenta" {
    switch (status) {
        // AKTIV
        // INAKT
        // AVSLU
        case "AKTIV":
            return "success";
        case "INAKT":
            return "warning";
        case "AVSLU":
            return "danger";
        default:
            return "neutral";
    }
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