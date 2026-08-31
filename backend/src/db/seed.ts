import { info } from "@rasla/logify";
import { closeDatabase } from "./index";
import { logError } from "../utils/logger";
import { genderSeeder } from "./seeders/gender.seeder";
import { adminSeeder } from "./seeders/admin.seeder";

export async function runSeeders() {
    info("Running database seeders...");
    await genderSeeder();
    await adminSeeder();

    info("✓ Database seeders completed");
}

async function main() {
    await runSeeders();
}


if (import.meta.main) {
    main()
        .catch((err) => {
            logError(err, "Seeders");
            process.exitCode = 1;
        })
        .finally(async () => {
            await closeDatabase();
        });
}