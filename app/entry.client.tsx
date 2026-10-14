import {startTransition, StrictMode} from "react";
import {hydrateRoot} from "react-dom/client";
import {HydratedRouter} from "react-router/dom";
import {init} from "@nais/apm";

startTransition(() => {
    init({app: "dp-arena-innsyn-klient", namespace: "teamdagpenger"});
    hydrateRoot(
        document,
        <StrictMode>
            <HydratedRouter/>
        </StrictMode>,
    );
});
