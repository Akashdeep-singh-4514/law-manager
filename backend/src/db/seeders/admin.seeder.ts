import { eq } from "drizzle-orm";
import { db } from "../index";
import { env } from "../../config/env";
import { users, genders } from "../schema";
import { UserRoles } from "../../modules/users/users.schema";

export async function adminSeeder() {
    const [maleGender] = await db
        .select({ id: genders.id })
        .from(genders)
        .where(eq(genders.code, "male"))
        .limit(1);

    await db
        .insert(users)
        .values({
            role: UserRoles.SUPERADMIN,
            name: env.adminConf.name,
            email: env.adminConf.email,
            password: env.adminConf.password,
            dialCode: env.adminConf.dialCode,
            mobile: env.adminConf.mobile,
            genderId: maleGender?.id,
        })
        .onConflictDoNothing({
            target: users.email,
        });
}