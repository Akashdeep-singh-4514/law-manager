import { db } from "../index";
import { env } from "../../config/env";
import { users } from "../schema";
import { UserRoles } from "../../modules/users/users.schema";


export async function adminSeeder() {
    await db
        .insert(users)
        .values({
            role: UserRoles.SUPERADMIN,
            name: env.adminConf.name,
            email: env.adminConf.email,
            password: env.adminConf.password,
            dialCode:env.adminConf.dialCode,
            mobile:env.adminConf.mobile,
        })
        .onConflictDoNothing({
            target: users.email,
        });
}
