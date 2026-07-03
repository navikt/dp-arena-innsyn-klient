import {reactRouter} from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import {defineConfig} from "vite";
import path from "path";
import devtoolsJson from "vite-plugin-devtools-json";
import {configDefaults} from "vitest/config";


export default defineConfig(({mode}) => ({
    base:
        process.env.NODE_ENV === "production"
            ? "https://cdn.nav.no/teamdagpenger/dp-arena-innsyn-klient/client/"
            : "/",
    server: {
        port: 3000,
    },
    // React Router's Vite plugin expects an HTML preamble and can fail under Vitest transforms.
    plugins: mode === "test" ? [tailwindcss(), devtoolsJson()] : [reactRouter(), tailwindcss(), devtoolsJson()],
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
    test: {
        globals: true,
        environment: 'node',
        exclude: [...configDefaults.exclude, '.react-router/**'],
        setupFiles: ['./vitest.setup.ts'],
    },
}));
