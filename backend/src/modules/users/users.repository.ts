import { db } from "../../db";
import { users } from "./users.schema";
import { eq } from "drizzle-orm";

export class UsersRepository {
    async findAll() {
        return db.select().from(users);
    }

    async findById(id: number) {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);

        return result[0] ?? null;
    }
}