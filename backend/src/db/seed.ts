import { info } from "@rasla/logify";
// import { db } from "./index";
// import { users } from "./schema";

export async function runSeeders() {
    info("Running database seeders...");

    // await db
    //     .insert(users)
    //     .values({
    //         name: "System Admin",
    //         email: "admin@law-manager.local",
    //     })
    //     .onConflictDoNothing({
    //         target: users.email,
    //     });

    info("✓ Database seeders completed");
}