import createClient from "openapi-fetch";
import type {paths} from "../../openapi/arena-sak-innsyn-typer";
import {getEnv} from "~/utils/env.utils";

export const arenaInnsynsClient = createClient<paths>({baseUrl: getEnv("DP_ARENA_GW_URL")});
