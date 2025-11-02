import { createServer } from "./app.js";
import { ENV } from "./config/env.js";
import { logger } from "./config/logger.js";

const PORT = ENV.PORT || 4000;

(async function start() {
    try {
        const app = await createServer();
        app.listen(PORT, () => logger.info(`🚀 Gescom API listening ${PORT}`));
    } catch (err) {
        logger.error("Server start error", err);
        process.exit(1);
    }
})();
