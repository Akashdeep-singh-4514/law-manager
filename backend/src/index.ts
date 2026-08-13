import { Elysia } from "elysia";
import { env } from "./config/env";
import { info, logger, error, debug } from "@rasla/logify";
import { mainRouter } from "./router";
import {
  connectDatabase,
  closeDatabase,
} from "./db";
import { runMigrations } from "./db/migrate";
import { runSeeders } from "./db/seed";
import { logError } from "./utils/logger";

async function bootstrap() {
  try {
    console.log("Starting application...");

    await connectDatabase();
    debug("reached here 1")
    await runMigrations();
    debug("reached here 2")

    await runSeeders();

    const app = new Elysia()
      .use(logger())
      .use(mainRouter)
      .get("/", () => "ok")
      .listen(env.appConf.port);

    info(
      `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
    );

    const shutdown = async () => {
      console.log("Shutting down...");

      app.stop();

      await closeDatabase();

      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (e) {
    error("❌ Application startup failed");
    logError(e)

    process.exit(1);
  }
}
bootstrap();