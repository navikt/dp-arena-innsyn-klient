import {InternalHeader, Page} from "@navikt/ds-react";
import styles from "~/route-styles/root.module.css";
import {type ActionFunctionArgs, Link, type LoaderFunctionArgs, Outlet, useLoaderData} from "react-router";
import {HeaderMeny} from "~/features/layout/components/header-meny/HeaderMeny";
import {SaksbehandlerProvider} from "~/features/layout/context/saksbehandler-context";
import {handleActions} from "~/features/handle-actions";
import {getSaksbehandler} from "~/features/layout/clients/auth.server";
import {getEnv} from "~/utils/env.utils";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({request}: LoaderFunctionArgs) {
    const saksbehandler = await getSaksbehandler(request);


    return {
        saksbehandler,
        env: {
            IS_LOCALHOST: getEnv("IS_LOCALHOST"),
            GCP_ENV: getEnv("GCP_ENV")
        }
    }

}

export default function Layout() {
    const { saksbehandler, env } = useLoaderData<typeof loader>();

    return (
        <SaksbehandlerProvider>
            {env.GCP_ENV === "dev" && (
                <div className={styles.devEnvironmentBanner}>DEV-MILJØ</div>
            )}
            <InternalHeader className={styles.header}>
                <Link to={"/"} className={styles.headerLogo}>
                    <InternalHeader.Title as="h1" className={styles.pageHeader}>
                        Dagpenger: Arena Innsyn
                    </InternalHeader.Title>
                </Link>

                <HeaderMeny saksbehandler={saksbehandler}/>
            </InternalHeader>
            {/*<AlertProvider>*/}
            {/*    <GlobalAlerts />*/}

            {/*    <Outlet />*/}
            {/*</AlertProvider>*/}
            <Page>
                <Outlet/>
            </Page>
        </SaksbehandlerProvider>

    )
}