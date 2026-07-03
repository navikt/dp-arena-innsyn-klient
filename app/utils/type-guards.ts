import type {AlertProps} from "@navikt/ds-react";

import type {IAlert} from "~/features/layout/context/alert-context";


export function isAlert(data: unknown): data is IAlert {
    const ALERT_VARIANTS: AlertProps["variant"][] = ["success", "warning", "error", "info"];

    if (typeof data !== "object" || data === null) {
        return false;
    }

    const obj = data as Record<string, unknown>;

    if (!ALERT_VARIANTS.includes(obj.variant as AlertProps["variant"])) {
        return false;
    }

    if (typeof obj.title !== "string" || !obj.title) {
        return false;
    }

    if ("body" in obj && obj.body !== undefined && typeof obj.body !== "string") {
        return false;
    }

    if ("service" in obj && obj.service !== undefined && typeof obj.service !== "string") {
        return false;
    }

    return true;
}


export function isDefined<T>(value: T | undefined | null): value is T {
    return value !== undefined && value !== null;
}




