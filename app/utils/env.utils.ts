declare global {
  interface Window {
    env: IEnv;
    // umami: typeof umami;
  }
}

interface IEnv {

  // GCP_ENV: string;
  IS_LOCALHOST: string;
  USE_MSW: string;
  DP_ARENA_GW_URL: string;

}

export function getEnv(value: keyof IEnv) {

  const env = typeof window !== "undefined" ? window.env : process.env;

  console.log("value", env[value])
  console.log("key", value)
  return env[value] || "";
}
