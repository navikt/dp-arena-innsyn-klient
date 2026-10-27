import {
    BodyShort,
    Button,
    DatePicker,
    Dialog,
    Radio,
    RadioGroup,
    Table,
    TextField,
    useDatepicker
} from "@navikt/ds-react";
import {type FormEvent, useLayoutEffect, useRef, useState} from "react";
import {format, isValid, parse} from "date-fns";
import {
    type ActionFunctionArgs,
    Form,
    type LoaderFunctionArgs,
    useLoaderData,
    useNavigate,
    useNavigation,
    useSubmit
} from "react-router";
import {handleActions} from "~/features/handle-actions";
import invariant from "tiny-invariant";
import {unleash} from "~/utils/unleash.server";
import {hentMigreringDatagrunnlag} from "~/features/sak/clients/migrer-sak-client.server";
import type {components} from "../../../openapi/arena-migrering-typer";
import styles from "./StartMigreringDialog.module.css";
import {fjernTusenskille, formaterBelopUnderInntasting} from "~/utils/number.utils";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: LoaderFunctionArgs) {
    invariant(params.sakId, "Mangler sak id")
    invariant(params.personId, "Mangler person id")

    const datagrunnlag = await hentMigreringDatagrunnlag(request, params.sakId);
    return {
        personId: params.personId,
        sakId: params.sakId,
        datagrunnlag,
        kanStarteMigrering: unleash.isEnabled("dp-migrering.start-migrering"),
    };
}

export default function StartMigreringDialog() {

    const {datagrunnlag, kanStarteMigrering, sakId, personId} = useLoaderData<typeof loader>();

    const navigate = useNavigate();
    const navigation = useNavigation();
    const submit = useSubmit();
    const [feil, setFeil] = useState<Record<string, string>>({});

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const valideringsfeil: Record<string, string> = {};
        const opplysninger: components["schemas"]["StartMigreringOpplysning"][] = [];

        for (const opplysning of datagrunnlag.opplysninger) {
            const verdiFelt = `opplysning-${opplysning.uuid}`;
            const innsendtVerdi = formData.get(verdiFelt);
            let verdi = opplysning.verdi?.verdi;
            if (typeof innsendtVerdi === "string") {
                const tekst = innsendtVerdi.trim();
                if (tekst === "") {
                    continue;
                }

                switch (opplysning.verdi?.type) {
                    case "integer": {
                        const tallTekst = fjernTusenskille(tekst);
                        if (!/^-?\d+$/.test(tallTekst) || !Number.isSafeInteger(Number(tallTekst))) {
                            valideringsfeil[verdiFelt] = "Skriv et gyldig heltall.";
                            continue;
                        }
                        verdi = Number(tallTekst);
                        break;
                    }
                    case "float": {
                        const tallTekst = fjernTusenskille(tekst);
                        const tall = Number(tallTekst.replace(",", "."));
                        if (!/^-?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(tallTekst) || !Number.isFinite(tall)) {
                            valideringsfeil[verdiFelt] = "Skriv et gyldig tall.";
                            continue;
                        }
                        verdi = tall;
                        break;
                    }
                    case "boolean":
                        if (tekst !== "true" && tekst !== "false") {
                            valideringsfeil[verdiFelt] = "Velg ja eller nei.";
                            continue;
                        }
                        verdi = tekst === "true";
                        break;
                    case "date": {
                        const dato = parseDatoTilIso(tekst);
                        if (!dato) {
                            valideringsfeil[verdiFelt] = "Skriv en gyldig dato på formen dd.mm.åååå.";
                            continue;
                        }
                        verdi = dato;
                        break;
                    }
                    case "string":
                        verdi = tekst;
                        break;
                }
            }
            if (verdi == null) {
                continue;
            }

            let gyldigFraOgMed = opplysning.gyldigFraOgMed;
            if (!gyldigFraOgMed) {
                const datoFelt = `gyldigFraOgMed-${opplysning.uuid}`;
                const innsendtDato = formData.get(datoFelt);
                const datoTekst = typeof innsendtDato === "string" ? innsendtDato.trim() : "";
                if (datoTekst === "") {
                    valideringsfeil[datoFelt] = "Fyll inn gyldighetsdato for opplysningen.";
                    continue;
                }
                const dato = parseDatoTilIso(datoTekst);
                if (!dato) {
                    valideringsfeil[datoFelt] = "Skriv en gyldig dato på formen dd.mm.åååå.";
                    continue;
                }
                gyldigFraOgMed = dato;
            }
            opplysninger.push({uuid: opplysning.uuid, verdi, gyldigFraOgMed});
        }

        setFeil(valideringsfeil);
        const forsteFeil = Object.keys(valideringsfeil)[0];
        if (forsteFeil) {
            const felt = event.currentTarget.elements.namedItem(forsteFeil);
            const fokusFelt = felt instanceof RadioNodeList ? felt.item(0) : felt;
            if (fokusFelt instanceof HTMLInputElement) {
                fokusFelt.focus();
            }
            return;
        }

        const grunnlag: components["schemas"]["StartMigrering"] = {
            sakId: datagrunnlag.sakId,
            initiertAv: datagrunnlag.initiertAv,
            ident: datagrunnlag.ident,
            innvilgetFraOgMed: datagrunnlag.innvilgetFraOgMed,
            innvilgetTilOgMed: datagrunnlag.innvilgetTilOgMed,
            opplysninger,
        };
        formData.set("grunnlag", JSON.stringify(grunnlag));
        submit(formData, {method: "post"});
    };

    const onCancel = () => {
        navigate(`/person/${personId}/saker/${sakId}`);
    }

    return (
        <Dialog open
                onOpenChange={(open) => {
                    if (!open) {
                        onCancel();
                    }
                }}
                size="medium">
            <Dialog.Popup width="80%">
                <Form method="post" onSubmit={onSubmit} style={{display: "contents"}}>
                    <input hidden={true} readOnly={true} name="_action" value="migrer-sak"/>

                    <Dialog.Header>
                        <Dialog.Title>Migrer sak</Dialog.Title>
                        <Dialog.Description>
                            <BodyShort>Følgende opplysninger vil bli migrert:</BodyShort>
                        </Dialog.Description>
                    </Dialog.Header>
                    <Dialog.Body>

                        {datagrunnlag.opplysninger && datagrunnlag.opplysninger.length > 0 && (
                            <>
                                <Table>
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.HeaderCell scope="col">Opplysning</Table.HeaderCell>
                                            <Table.HeaderCell scope="col">Verdi</Table.HeaderCell>
                                            <Table.HeaderCell scope="col">Gyldig fra og med</Table.HeaderCell>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {
                                            datagrunnlag.opplysninger.map((opplysning, index) => {
                                                const gyldigFraOgMed = opplysning.gyldigFraOgMed;
                                                return (
                                                    <Table.Row key={opplysning.uuid ?? index}>
                                                        <Table.HeaderCell
                                                            scope="row">{opplysning.navn}</Table.HeaderCell>
                                                        <Table.DataCell>
                                                            <OpplysningVerdi
                                                                opplysning={opplysning}
                                                                error={feil[`opplysning-${opplysning.uuid}`]}/>
                                                        </Table.DataCell>
                                                        <Table.DataCell>{gyldigFraOgMed ? Intl.DateTimeFormat("no-NO", {
                                                                day: "2-digit",
                                                                month: "2-digit",
                                                                year: "numeric"
                                                            }).format(new Date(gyldigFraOgMed))
                                                            : (
                                                                <FraOgMed
                                                                    opplysning={opplysning}
                                                                    error={feil[`gyldigFraOgMed-${opplysning.uuid}`]}/>
                                                            )}</Table.DataCell>
                                                    </Table.Row>
                                                );
                                            })}
                                    </Table.Body>
                                </Table>
                            </>
                        )}
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.CloseTrigger>
                            <Button type="button" onClick={onCancel}>Lukk</Button>
                        </Dialog.CloseTrigger>
                        <Button type="submit" variant="primary" disabled={!kanStarteMigrering}
                                loading={navigation.state !== "idle"}>
                            Start migrering
                        </Button>
                    </Dialog.Footer>
                </Form>
            </Dialog.Popup>
        </Dialog>
    );
}

function OpplysningVerdi({opplysning, error}: {
    opplysning: components["schemas"]["MigreringGrunnlagOpplysning"];
    error?: string;
}) {

    if (opplysning.verdi?.type === "boolean") {
        if (opplysning.verdi.verdi === null || opplysning.verdi.verdi === undefined) {
            return <RadioGroup legend={opplysning.navn}
                               name={`opplysning-${opplysning.uuid}`}
                               error={error}
                               hideLegend
            size={'small'}>
                <Radio value="true">Ja</Radio>
                <Radio value="false">Nei</Radio>
            </RadioGroup>;
        }
        return <BodyShort>{opplysning.verdi.verdi ? "Ja" : "Nei"}</BodyShort>;
    }

    if (opplysning.verdi?.type === "string") {
        if (!opplysning.verdi.verdi) {
            return <TextField label={opplysning.navn}
                              name={`opplysning-${opplysning.uuid}`}
                              type="text"
                              inputMode="text"
                              defaultValue=""
                              error={error}
                              hideLabel
                              htmlSize={16}
                              size={'small'}/>;
        }
        return <BodyShort>{opplysning.verdi.verdi as string}</BodyShort>;
    }

    if (opplysning.verdi?.type === "integer" || opplysning.verdi?.type === "float") {
        if (opplysning.verdi.verdi === null || opplysning.verdi.verdi === undefined) {
            return <BelopFelt opplysning={opplysning} error={error}/>;
        }
        return <BodyShort>
            {Intl.NumberFormat("no-NO", {maximumFractionDigits: 20}).format(opplysning.verdi.verdi as number)}
            {opplysning.verdi.type === "integer" ? " kr" : ""}
        </BodyShort>;
    }

    if (opplysning.verdi?.type === "date") {
        if (!opplysning.verdi.verdi) {
            return <DatoOpplysning opplysning={opplysning} error={error}/>;
        }
        return <BodyShort>
            {Intl.DateTimeFormat("no-NO", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }).format(new Date(opplysning.verdi.verdi as string))}
        </BodyShort>
    }
}

function BelopFelt({opplysning, error}: {
    opplysning: components["schemas"]["MigreringGrunnlagOpplysning"];
    error?: string;
}) {
    const [felt, setFelt] = useState({
        verdi: "",
        start: 0,
        slutt: 0,
    });
    const inputRef = useRef<HTMLInputElement>(null);

    useLayoutEffect(() => {
        const input = inputRef.current;
        if (input && input === document.activeElement) {
            input.setSelectionRange(felt.start, felt.slutt);
        }
    }, [felt]);

    return (
        <div className={styles.amountField}>
            <TextField label={opplysning.navn}
                       description="Beløp i kroner."
                       name={`opplysning-${opplysning.uuid}`}
                       ref={inputRef}
                       type="text"
                       inputMode={opplysning.verdi?.type === "integer" ? "numeric" : "decimal"}
                       value={felt.verdi}
                       onChange={(event) => {
                           const input = event.currentTarget;
                           const formatert = formaterBelopUnderInntasting(input.value);
                           const finnPosisjon = (posisjon: number) => {
                               let tegnIgjen = fjernTusenskille(input.value.slice(0, posisjon)).length;
                               let indeks = 0;
                               while (indeks < formatert.length && tegnIgjen > 0) {
                                   if (fjernTusenskille(formatert[indeks]) !== "") {
                                       tegnIgjen--;
                                   }
                                   indeks++;
                               }
                               return indeks;
                           };
                           setFelt({
                               verdi: formatert,
                               start: finnPosisjon(input.selectionStart ?? input.value.length),
                               slutt: finnPosisjon(input.selectionEnd ?? input.value.length),
                           });
                       }}
                       onKeyDown={(event) => {
                           const input = event.currentTarget;
                           const posisjon = input.selectionStart;
                           if (posisjon === null || posisjon !== input.selectionEnd || event.ctrlKey || event.metaKey || event.altKey) {
                               return;
                           }
                           if (event.key === "Backspace" && posisjon > 0 && fjernTusenskille(input.value[posisjon - 1]) === "") {
                               input.setSelectionRange(posisjon - 1, posisjon - 1);
                           } else if (event.key === "Delete" && posisjon < input.value.length && fjernTusenskille(input.value[posisjon]) === "") {
                               input.setSelectionRange(posisjon + 1, posisjon + 1);
                           }
                       }}
                       error={error}
                       hideLabel
                       size="small"/>
            <span className={styles.currencySuffix} aria-hidden="true">kr</span>
        </div>
    );
}

const FraOgMed = ({opplysning, error}: {
    opplysning: components["schemas"]["MigreringGrunnlagOpplysning"];
    error?: string;
}) => {
    const {datepickerProps, inputProps} = useDatepicker({
        fromDate: new Date("Aug 23 2019"),
        allowTwoDigitYear: false,
    });

    return (
        <DatePicker {...datepickerProps}>
            <DatePicker.Input
                {...inputProps}
                label={`Gyldig fra og med for ${opplysning.navn}`}
                name={`gyldigFraOgMed-${opplysning.uuid}`}
                error={error}
                description="Format: dd.mm.åååå"
                hideLabel
                size={'small'}
            />
        </DatePicker>
    );
};

const DatoOpplysning = ({opplysning, error}: {
    opplysning: components["schemas"]["MigreringGrunnlagOpplysning"];
    error?: string;
}) => {
    const {datepickerProps, inputProps} = useDatepicker({
        fromDate: new Date("Aug 23 2019"),
        allowTwoDigitYear: false,
    });

    return (
        <DatePicker {...datepickerProps}>
            <DatePicker.Input
                {...inputProps}
                label={opplysning.navn}
                name={`opplysning-${opplysning.uuid}`}
                error={error}
                description="Format: dd.mm.åååå"
                hideLabel
                size={'small'}
            />
        </DatePicker>
    );
};

function parseDatoTilIso(tekst: string): string | undefined {
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(tekst)) {
        return undefined;
    }
    const dato = parse(tekst, "dd.MM.yyyy", new Date());
    return isValid(dato) ? format(dato, "yyyy-MM-dd") : undefined;
}