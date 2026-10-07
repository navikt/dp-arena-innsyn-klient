import type { Config } from "@react-router/dev/config";

export default {
  // Config options...
  // Server-side render by default, to enable SPA mode set this to `false`
  ssr: true,
  basename: "/",
  allowedActionOrigins: ["arena-innsyn-dagpenger.ansatt.dev.nav.no",],
} satisfies Config;
