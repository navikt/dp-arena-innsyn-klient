import {setupServer} from "msw/node";

import {logger} from "~/utils/logger.utils";
import {mockAzure} from "./mock-azure";

const mswHandlers = [
    ...mockAzure,

];

export async function startMockServer() {
    const server = setupServer(...mswHandlers);

    server.listen({onUnhandledRequest: "warn"});
    server.events.on("request:start", ({request}) => {
        logger.info(`[MSW INTERCEPTED]: ${request.method} ${request.url}`);
    });

    process.once("SIGINT", () => server.close());
    process.once("SIGTERM", () => server.close());
}
