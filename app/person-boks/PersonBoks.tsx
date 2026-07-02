import {BodyShort, CopyButton,} from "@navikt/ds-react";
import {useSaksbehandler} from "~/hooks/useSaksbehandler";
import {maskerVerdi} from "~/utils/skjul-sensitiv-opplysning";

import type {components} from "../../openapi/arena-sak-innsyn-typer";
import styles from "./PersonBoks.module.css";
import classnames from "classnames";
import {CircleFillIcon, FigureOutwardFillIcon, SilhouetteFillIcon} from "@navikt/aksel-icons";
import {finnKjonnFraFodselsnummer} from "~/utils/fodselsnummer.utils";

interface IProps {
    person: components["schemas"]["ArenaPersonResponse"];
}

export function PersonBoks({person}: IProps) {
    const {skjulSensitiveOpplysninger} = useSaksbehandler();

    const navn = `${person.fornavn} ${person.etternavn}`;
    const fødselsnummerMedMellomrom = `${person.fodselsnummer?.slice(0, 6)} ${person.fodselsnummer?.slice(6)}`;

    const kjonn = finnKjonnFraFodselsnummer(person.fodselsnummer);
    return (
        <>
            <div className={styles.container}>
                <div className={styles.navnContainer}>
                    <span
                        className={classnames(styles.iconContainer, {
                            [styles.iconContainerMann]: kjonn === "MANN",
                            [styles.iconContainerKvinne]: kjonn === "KVINNE",
                        })}
                    >
                      {kjonn === "MANN" && (
                          <SilhouetteFillIcon title="" fontSize="1.5rem" color="white"/>
                      )}
                        {kjonn === "KVINNE" && (
                            <FigureOutwardFillIcon title="" fontSize="1.5rem" color="white"/>
                        )}
                        {kjonn === "UKJENT" && (
                            <CircleFillIcon title="" fontSize="1.5rem" color="white"/>
                        )}
                    </span>

                    <BodyShort size="small" weight="semibold">
                        {skjulSensitiveOpplysninger ? maskerVerdi(navn) : navn}
                    </BodyShort>
                </div>

                <BodyShort size="small" textColor="subtle" className={styles.infoElement}>
                    Fødselsnummer:{" "}
                    {skjulSensitiveOpplysninger
                        ? maskerVerdi(fødselsnummerMedMellomrom)
                        : fødselsnummerMedMellomrom}
                    <CopyButton copyText={person.fodselsnummer || ""} size="xsmall"/>
                </BodyShort>

                {/*<BodyShort size="small" textColor="subtle" className={styles.infoElement}>*/}
                {/*    Alder: <b>{person.alder}</b>*/}
                {/*</BodyShort>*/}

                {/*<BodyShort size="small" textColor="subtle" className={styles.infoElement}>*/}
                {/*    Kjønn: <b>{person.kjonn}</b>*/}
                {/*</BodyShort>*/}

                {/*<BodyShort size="small" textColor="subtle" className={styles.infoElement}>*/}
                {/*    Statsborgerskap: <b>{person.statsborgerskap}</b>*/}
                {/*</BodyShort>*/}

            </div>

        </>
    );
}

