import { buildApp } from "../../apps/api/dist/app.js";

const app = buildApp({ LOG_LEVEL: "silent" });
await app.listen({ host: "127.0.0.1", port: 3001 });
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => void app.close());
