import {
    type ActionFunctionArgs,
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration, useRouteError,
} from "react-router";
import akselDarksideOverrides from "~/aksel-darkside-overrides.css?url";
import globalDarksideCss from "~/global-darkside.css?url";


import type {Route} from "./+types/root";
import "./app.css";
import {handleActions} from "~/server-side-actions/handle-actions";
import {SaksbehandlerProvider} from "~/context/saksbehandler-context";
import {RootErrorBoundaryView} from "~/error-boundary/RootErrorBoundaryView";

export function meta() {
    return [
        {
            charset: "utf-8",
        },
        {
            name: "viewport",
            content: "width=device-width,initial-scale=1",
        },
        {title: "Dagpenger saksbehandling"},
        {
            property: "og:title",
            content: "Dagpenger saksbehandling",
        },
        {
            name: "description",
            content: "Saksbehandlingløsning for dagpenger",
        },
    ];
}

export function links() {
    return [
        {rel: "stylesheet", href: globalDarksideCss},
        {rel: "stylesheet", href: akselDarksideOverrides},
        // {
        //   rel: "icon",
        //   type: "image/png",
        //   sizes: "32x32",
        //   href: `${getEnv("IS_LOCALHOST") ? "" : "https://cdn.nav.no/teamdagpenger/dp-saksbehandling-frontend/client"}/favicon-32x32.png`,
        // },
        // {
        //   rel: "icon",
        //   type: "image/png",
        //   sizes: "16x16",
        //   href: `${getEnv("IS_LOCALHOST") ? "" : "https://cdn.nav.no/teamdagpenger/dp-saksbehandling-frontend/client"}/favicon-16x16.png`,
        // },
        // {
        //   rel: "icon",
        //   type: "image/x-icon",
        //   href: `${getEnv("IS_LOCALHOST") ? "" : "https://cdn.nav.no/teamdagpenger/dp-saksbehandling-frontend/client"}/favicon.ico`,
        // },
    ];
}

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}


export function Layout({children}: { children: React.ReactNode }) {

    return (
        <html lang="en">
        <head>
            <meta charSet="utf-8"/>
            <meta name="viewport" content="width=device-width, initial-scale=1"/>
            <Meta/>
            <Links/>
        </head>
        <body>

        {children}
        <ScrollRestoration/>
        <Scripts/>
        </body>
        </html>
    );
}

export default function App() {
    return (
        // <SaksbehandlerProvider>

            <Outlet/>
        // </SaksbehandlerProvider>
    );
}

export function ErrorBoundary() {
    const error = useRouteError();

    return <RootErrorBoundaryView links={<Links />} meta={<Meta />} error={error} />;
}
