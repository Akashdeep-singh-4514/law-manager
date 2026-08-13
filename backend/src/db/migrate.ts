import { existsSync,readdirSync } from "fs";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

const migrationsFolder = "./drizzle";

async function runMigrations() {

    if (!existsSync(migrationsFolder)) {
    console.log("⚠️ Migrations folder does not exist. Skipping migration.");
    return;
  }

    const files = readdirSync(migrationsFolder).filter((f) => f.endsWith(".sql"));

    if (files.length === 0) {
        console.log("⚠️ No migration files found. Skipping migration.");
        return;
    }

    console.log(`🚀 Running ${files.length} migration(s)...`);
    await migrate(db, { migrationsFolder });
    console.log("✅ Migrations completed successfully.");
}

export { runMigrations }