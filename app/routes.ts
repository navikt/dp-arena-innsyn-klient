import {index, layout, route, type RouteConfig} from "@react-router/dev/routes";

export default [
    layout("features/layout/index.tsx", [

        index("features/index.tsx"),
        route("person/:personId", "features/person/PersonPage.tsx", [
            route("saker", "features/sak/SaksListePage.tsx", [
                route(":sakId", "features/sak/SaksDetaljerPage.tsx"),
            ])
        ]),
        route("saker/:sakId", "features/migrering/MigreringPage.tsx", [
            route("migreringer", "features/migrering/MigreringList.tsx",[
                route(":migreringId", "features/migrering/MigreringDetaljerPage.tsx",)
            ] ),
        ]),
        route("api/internal", "features/api/index.ts", [
            route("isReady", "features/api/is-ready.ts"),
            route("isAlive", "features/api/is-alive.ts"),
            route("metrics", "features/api/metrics.ts")

        ])
    ]),
    route(
        "api/migrering/:migreringId/oppdateringer",
        "features/migrering/oppdateringer.ts",
    ),
    route("api/migrering/hendelse/:hendelseId", "features/migrering/hendelse.ts"),

] satisfies RouteConfig;
