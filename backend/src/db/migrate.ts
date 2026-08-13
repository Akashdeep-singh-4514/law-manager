import { existsSync, readdirSync } from "fs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";
import { info } from "@rasla/logify";
import { logError } from "../utils/logger";

const migrationsFolder = "./drizzle/migrations";

async function runMigrations() {
    if (!existsSync(migrationsFolder)) {
        info("⚠️ Migrations folder does not exist. Skipping migration.");
        return;
    }

    const files = readdirSync(migrationsFolder).filter((f) => f.endsWith(".sql"));

    if (files.length === 0) {
        info("⚠️ No migration files found. Skipping migration.");
        return;
    }

    info(`🚀 Running ${files.length} migration(s)...`);
    await migrate(db, { migrationsFolder });
    info("✅ Migrations completed successfully.");
}

async function main() {
    await runMigrations();
    return;
}

main().catch((err) => {
    logError(err, "Migrations");
    process.exit(1);
});

export { runMigrations };
