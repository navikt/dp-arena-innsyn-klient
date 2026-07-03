import {index, layout, route, type RouteConfig} from "@react-router/dev/routes";

export default [
    layout("features/layout/index.tsx", [

        index("features/index.tsx"),
        route("person/:personId", "features/person/PersonPage.tsx", [
            route("saker", "features/sak/SaksListePage.tsx", [
                route(":sakId", "features/sak/SaksDetaljerPage.tsx"),

            ])
        ])
    ])

] satisfies RouteConfig;

