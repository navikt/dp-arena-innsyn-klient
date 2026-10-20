import createClient from "openapi-fetch";
import type {paths as innsynPaths} from "../../openapi/arena-sak-innsyn-typer";
import type {paths as migreringPaths} from "../../openapi/arena-migrering-typer";
import {getEnv} from "~/utils/env.utils";

export const arenaInnsynsClient = createClient<innsynPaths>({baseUrl: getEnv("DP_MIGRERING_URL")});
export const arenaMigreringClient = createClient<migreringPaths>({baseUrl: getEnv("DP_MIGRERING_URL")});
