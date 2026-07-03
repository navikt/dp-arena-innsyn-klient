import {logger} from "~/utils/logger.utils";

import type {components as saksbehandlingComponent} from "../../openapi/arena-sak-innsyn-typer";
import type {IAlert} from "~/features/layout/context/alert-context";

export function handleHttpProblem(
    problem:
    | saksbehandlingComponent["schemas"]["HttpProblem"],
    logLevel: "error" | "warn" | "info" = "error",
): void {
    logger[logLevel](`${problem.status} - ${problem.title}: ${problem.detail}`);

    throw new Response(problem.title, {
        status: problem.status,
        statusText: problem.detail,
    });
}

export function getHttpProblemAlert(
    problem:
    | saksbehandlingComponent["schemas"]["HttpProblem"],
    logLevel: "error" | "warn" | "info" = "error",
    variant: IAlert["variant"] = "error",
): IAlert {
    logger[logLevel](`${problem.status} - ${problem.title}: ${problem.detail}`);

    return {
        variant,
        title: problem.title || "Ukjent feil",
        body: problem.detail,
        service: problem.instance,
    };
}
