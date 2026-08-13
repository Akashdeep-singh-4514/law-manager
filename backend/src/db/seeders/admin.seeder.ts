import { db } from "../index";
import { env } from "../../config/env";
import { adminRoles, admins } from "../../modules/admin/admin.schema";

export async function adminSeeder() {
    await db
        .insert(admins)
        .values({
            role: adminRoles.SUPERADMIN,
            name: env.adminConf.name,
            email: env.adminConf.email,
            password: env.adminConf.password,
        })
        .onConflictDoNothing({
            target: admins.email,
        });
}
