declare global {
    interface Window {
        env: IEnv;
        // umami: typeof umami;
    }
}

interface IEnv {
    IS_LOCALHOST: string;
    USE_MSW: string;
    DP_MIGRERING_URL: string;
    GCP_ENV: string;
    UNLEASH_SERVER_API_URL: string;
    UNLEASH_SERVER_API_TOKEN: string;
}

export function getEnv(value: keyof IEnv) {

    const env = typeof window !== "undefined" ? window.env : process.env;

    return env[value] || "";
}
