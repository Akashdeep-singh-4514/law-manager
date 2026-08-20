import { Elysia } from "elysia";
import { env } from "./config/env";
import { info, logger } from "@rasla/logify";
import { mainRouter } from "./router";
import { connectDatabase, closeDatabase } from "./db";
import { runMigrations } from "./db/migrate";
import { runSeeders } from "./db/seed";
import { logError } from "./utils/logger";
import { responseMiddleware } from "./utils/middleware";
import { cors } from '@elysia/cors'

async function bootstrap() {
    try {
        info("Starting application...");

        await connectDatabase();
        await runMigrations();

        await runSeeders();

        const app = new Elysia()
            .use(logger())
            .onRequest(({ request }) => {
                info(`REQUEST URL: ${JSON.stringify(request.url)}`);
            })
            .use(
                cors({
                    origin: "http://localhost:3000",
                    credentials: true,
                    methods: ["GET", "POST"],
                }),
            )
            .use(responseMiddleware)
            .use(mainRouter)
            .get("/", () => "ok")
            .listen(env.appConf.port);

        info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

        const shutdown = async () => {
            info("Shutting down...");

            app.stop();

            await closeDatabase();

            process.exit(0);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (e) {
        logError(e, "Application startup");

        process.exit(1);
    }
}
bootstrap();
