import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Map the "@/*" tsconfig path alias to the repo root so tests can import
// app modules the same way application code does.
export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        globals: true,
        include: ["test/**/*.test.ts"],
        clearMocks: true,
    },
});
