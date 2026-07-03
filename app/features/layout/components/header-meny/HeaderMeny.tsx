import {MoonIcon, SunIcon} from "@navikt/aksel-icons";
import {Button} from "@navikt/ds-react";


import {PersonSok} from "~/components/person-sok/PersonSok";
import styles from "./HeaderMeny.module.css";
import type {ISaksbehandler} from "~/features/layout/clients/auth.server";
import {useSaksbehandler} from "~/hooks/useSaksbehandler";
import {HeaderSaksbehandlerMeny} from "~/features/layout/components/header-meny/HeaderSaksbehandlerMeny";

interface IProps {
    saksbehandler: ISaksbehandler;
}

export function HeaderMeny({saksbehandler}: IProps) {
    const {tema, setTema} = useSaksbehandler();


    return (
        <div className={styles.container}>
            <div className={styles.linkContainer}>
            </div>

            <div className={styles.searchAndSaksbehandlerContainer}>
                <PersonSok/>
                <HeaderSaksbehandlerMeny saksbehandler={saksbehandler}/>

                <Button
                    variant={"tertiary-neutral"}
                    icon={
                        tema === "light" ? (
                            <SunIcon title={"Endre til mørkt tema"} color={"white"}/>
                        ) : (
                            <MoonIcon title={"Endre til lyst tema"} color={"white"}/>
                        )
                    }
                    onClick={() => setTema(tema === "light" ? "dark" : "light")}
                />
            </div>
        </div>
    );
}
