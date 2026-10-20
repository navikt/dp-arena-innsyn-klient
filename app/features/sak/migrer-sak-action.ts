import {migrerSak} from "~/features/sak/clients/migrer-sak-client.server";

export async function migrerSakAction(request: Request, sakId: string) {

    return await migrerSak(request, sakId);
}