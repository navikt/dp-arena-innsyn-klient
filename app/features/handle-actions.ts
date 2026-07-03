import type {ActionFunctionArgs} from "react-router";
import {sokPersonAction} from "~/components/person-sok/sok-person-action";
import {getEnv} from "~/utils/env.utils";
import {logger} from "~/utils/logger.utils";

export async function handleActions(request: Request, params: ActionFunctionArgs["params"]) {
    const formData = await request.formData();
    const actionToRun = formData.get("_action") as string;

    switch (actionToRun) {
        case "sok-person":
            return await sokPersonAction(request, formData);

        default:
            logger.warn(`Ukjent action: ${actionToRun}`);
            if (getEnv("IS_LOCALHOST") === "true") {
                throw new Error(`Ukjent action: ${actionToRun}`);
            }
            return null;
    }
}
