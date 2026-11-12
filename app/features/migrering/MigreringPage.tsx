import {type ActionFunctionArgs, Outlet} from "react-router";
import {handleActions} from "~/features/handle-actions";
import invariant from "tiny-invariant";
import StartMigrering from "~/features/migrering/StartMigrering";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params}: ActionFunctionArgs) {
    invariant(params.sakId, "sakId is required");

    return {
        sakId: params.sakId
    }
}

export default function MigreringPage() {
    return (
        <>
            <StartMigrering/>
            <div className={`main flex gap-4`}>
                <Outlet/>
            </div>
        </>
    )
}

