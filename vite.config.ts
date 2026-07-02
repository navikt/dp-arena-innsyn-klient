import {reactRouter} from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import {defineConfig} from "vite";
import path from "path";
import devtoolsJson from "vite-plugin-devtools-json";


export default defineConfig({
    base:
        process.env.NODE_ENV === "production"
            ? "https://cdn.nav.no/teamdagpenger/dp-arena-innsyn-klient/client/"
            : "/",
    server: {
        port: 3001,
    },
    plugins: [reactRouter(), tailwindcss(), devtoolsJson()],
    build: {
        manifest: true,
        sourcemap: true,
    },
    resolve: {
        tsconfigPaths: true,
        alias: {
            "~": path.resolve(__dirname, "./app"),
        },
    },
    ssr: {
        noExternal: ["@rvf/react-router"],
    },
    optimizeDeps: {
        include: ["@rvf/react-router", "react-router"],
    },
});
