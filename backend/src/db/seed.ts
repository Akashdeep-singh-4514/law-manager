import { info } from "@rasla/logify";
import { adminSeeder } from "./seeders/admin.seeder";

export async function runSeeders() {
    info("Running database seeders...");
    await adminSeeder()

    info("✓ Database seeders completed");
}
