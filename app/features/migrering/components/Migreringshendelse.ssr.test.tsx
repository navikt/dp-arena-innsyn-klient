// @vitest-environment node

import {Accordion} from "@navikt/ds-react";
import {renderToString} from "react-dom/server";
import {createRoutesStub} from "react-router";
import {describe, expect, it} from "vitest";
import {Migreringshendelse} from "~/features/migrering/components/Migreringshendelse";

describe("Migreringshendelse SSR", () => {
    it("kan importeres og serverrendres uten document", () => {
        const RoutesStub = createRoutesStub([{
            path: "/",
            Component: () => (
                <Accordion>
                    <Migreringshendelse hendelse={{id: 42, hendelse: "MIGRERING_STARTET"}}/>
                </Accordion>
            ),
        }]);

        expect(typeof document).toBe("undefined");
        const html = renderToString(<RoutesStub initialEntries={["/"]}/>);
        expect(html).toContain("MIGRERING_STARTET");
    });
});
