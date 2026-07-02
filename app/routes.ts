import {index, layout, route, type RouteConfig} from "@react-router/dev/routes";

export default [
    layout("routes/layout.tsx", [

        index("routes/index.tsx"),
        route("person/:personId", "routes/Person.tsx", [
            route("saker", "routes/PersonSaksliste.tsx", [
                route(":sakId", "routes/PersonSakDetaljer.tsx"),

            ])
        ])
    ])

] satisfies RouteConfig;

