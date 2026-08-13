import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../config/env";
import { info, error } from "@rasla/logify";

const client = postgres(env.dbConf.url);

export const db = drizzle(client);

export async function connectDatabase() {
    try {
        await client`SELECT 1`;
        info("✓ PostgreSQL connected");
    } catch (e) {
        error("✗ PostgreSQL connection failed");
        throw e;
    }
}

export async function closeDatabase() {
    await client.end();
    info("✓ PostgreSQL connection closed");
}