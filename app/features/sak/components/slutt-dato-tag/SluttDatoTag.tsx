import {Tag} from "@navikt/ds-react";
import {differenceInWeeks} from "date-fns";

export function SluttdatoTag({ sluttdato }: { sluttdato: Date }): React.ReactElement {
    if (differenceInWeeks(new Date(), sluttdato) > 52) {
        return (
            <Tag variant="moderate" size="small" data-color="neutral" data-testid="sak-over-52-uker">
                Over 52 uker
            </Tag>
        );
    }
    return (
        <Tag variant="moderate" size="small" data-color="warning" data-testid="sak-under-52-uker">
            Under 52 uker
        </Tag>
    );
}