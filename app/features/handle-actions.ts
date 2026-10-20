import type {ActionFunctionArgs} from "react-router";
import {sokPersonAction} from "~/components/person-sok/sok-person-action";
import {getEnv} from "~/utils/env.utils";
import {logger} from "~/utils/logger.utils";
import {migrerSakAction} from "~/features/sak/migrer-sak-action";
import invariant from "tiny-invariant";

export async function handleActions(request: Request, params: ActionFunctionArgs["params"]) {
    const formData = await request.formData();
    const actionToRun = formData.get("_action") as string;

    switch (actionToRun) {
        case "sok-person":
            return await sokPersonAction(request, formData);

        case "migrer-sak":
            invariant(params.sakId, "params.sakId er påkrevd for migrer-sak action");
            return migrerSakAction(request, params.sakId);

        default:
            logger.warn(`Ukjent action: ${actionToRun}`);
            if (getEnv("IS_LOCALHOST") === "true") {
                throw new Error(`Ukjent action: ${actionToRun}`);
            }
            return null;
    }
}
