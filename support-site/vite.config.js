import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
// This public application identifier is bundled into the browser page, not a signing key.
const DEFAULT_REOWN_PROJECT_ID = "5d4889fdf90098dd67f78fdbb65b82c0";

export default defineConfig(({ command, mode }) => {
    const env = { ...loadEnv(mode, root), ...process.env };
    const projectId = (env.VITE_REOWN_PROJECT_ID || "").trim() || DEFAULT_REOWN_PROJECT_ID;
    if (command === "build" && mode !== "preview" && !/^[a-f0-9]{32}$/i.test(projectId)) {
        throw new Error("VITE_REOWN_PROJECT_ID must contain 32 hexadecimal characters. Leave it unset to use Ztab's default Reown project.");
    }
    return {
        root,
        base: "./",
        define: { "import.meta.env.VITE_REOWN_PROJECT_ID": JSON.stringify(projectId) },
        build: { outDir: "../dist-support", emptyOutDir: true, target: "es2022" },
        server: { host: "127.0.0.1", port: 4173, strictPort: true },
        preview: { host: "127.0.0.1", port: 4173, strictPort: true },
    };
});
