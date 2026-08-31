import { env } from "../config/env";
import { info, error } from "@rasla/logify";
import { db, connectDatabase } from "./index";
import { sql } from "drizzle-orm";
import { runMigrations } from "./migrate";
import { runSeeders } from "./seed";
import { logError } from "../utils/logger";

async function resetDatabase() {
    // Hard guard — this must never run outside dev, no matter how it's invoked.
    if (env.appConf.environment === "production" || env.appConf.environment === "staging" ) {
        error(
            `Refusing to reset database: NODE_ENV is "${env.appConf.environment}", not "development".`,
        );
        process.exit(1);
    }

    // Second guard — an explicit opt-in flag, so a stray `bun run db:reset`
    // in dev doesn't wipe data by accident either.
    if (env.dbConf.confirmReset !== "yes") {
        error(
            'Refusing to reset database: re-run with CONFIRM_RESET=yes to confirm.',
        );
        process.exit(1);
    }

    try {
        info("Connecting to database...");
        await connectDatabase();

        info("Dropping public schema...");
        await db.execute(sql`DROP SCHEMA public CASCADE;`);
        await db.execute(sql`CREATE SCHEMA public;`);

        info("Dropping drizzle metadata schema...");
        await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE;`);

        info("Re-running migrations...");
        await runMigrations();

        info("Re-running seeders...");
        await runSeeders();

        info("Database reset complete.");
        process.exit(0)
    } catch (e) {
        logError(e,"=== RAW ERROR DUMP ===");
        process.exit(1);
    }
}

if (import.meta.main) {
    resetDatabase();
}