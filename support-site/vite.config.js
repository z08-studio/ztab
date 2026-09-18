import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ command, mode }) => {
    const env = { ...loadEnv(mode, root), ...process.env };
    // An unconfigured local preview is useful; a public build must have its own
    // valid project ID rather than silently shipping broken wallet connections.
    if (command === "build" && mode !== "preview" && !/^[a-f0-9]{32}$/i.test(env.VITE_REOWN_PROJECT_ID || "")) {
        throw new Error("Set VITE_REOWN_PROJECT_ID in support-site/.env.local before building for deployment. Use support:build:preview for a local preview without wallet connections.");
    }
    return {
        root,
        base: "./",
        build: { outDir: "../dist-support", emptyOutDir: true, target: "es2022" },
        server: { host: "127.0.0.1", port: 4173, strictPort: true },
        preview: { host: "127.0.0.1", port: 4173, strictPort: true },
    };
});
