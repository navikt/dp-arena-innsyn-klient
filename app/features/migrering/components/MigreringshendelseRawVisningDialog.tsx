import {useRef} from "react";
import {Button, HStack, Modal} from "@navikt/ds-react";

export function lesHendelsesdata(tekst: string) {
    let data: unknown;
    try {
        data = JSON.parse(tekst);
    } catch (error) {
        if (!(error instanceof SyntaxError)) {
            throw error;
        }
        return {data: null, tekst, feil: "Hendelsen inneholder ugyldig JSON. Viser originalteksten."};
    }

    if (data === null || typeof data !== "object") {
        return {data: null, tekst, feil: "Hendelsen inneholder ikke et JSON-objekt eller en liste. Viser originalteksten."};
    }

    return {data, tekst: JSON.stringify(data, null, 2), feil: null};
}

export function MigreringshendelseRawVisningDialog({tekst}: {tekst: string}) {

    const ref = useRef<HTMLDialogElement>(null);

    return (
        <HStack justify={"end"}>
            <Button type="button" onClick={() => ref.current?.showModal()} size={"small"} variant={"tertiary"}>Vis raw
                melding</Button>

            <Modal ref={ref} header={{heading: "Raw melding"}} size={"medium"} width={"100%"}>
                <Modal.Body>
                    <pre  style={{
                        whiteSpace: "pre-wrap",
                        fontSize: "0.75rem",
                        fontFamily: "monospace",
                    }}>{tekst}</pre>
                </Modal.Body>
                <Modal.Footer>

                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => ref.current?.close()}
                    >
                        Lukk
                    </Button>

                </Modal.Footer>
            </Modal>
        </HStack>
    );
}