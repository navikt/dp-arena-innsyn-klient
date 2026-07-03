declare global {
    interface Window {
        env: IEnv;
        // umami: typeof umami;
    }
}

interface IEnv {
    IS_LOCALHOST: string;
    USE_MSW: string;
    DP_ARENA_GW_URL: string;
    GCP_ENV: string;
}

export function getEnv(value: keyof IEnv) {

    const env = typeof window !== "undefined" ? window.env : process.env;

    return env[value] || "";
}
