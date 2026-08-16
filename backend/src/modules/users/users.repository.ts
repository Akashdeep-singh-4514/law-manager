import { db } from "../../db";
import { users, type PublicUser, type User } from "./users.schema";
import { eq, getTableColumns } from "drizzle-orm";


const { password, ...safeColumns } = getTableColumns(users);
export class UsersRepository {
    async findAll() {
        const result = db.select(safeColumns).from(users);
        return result;
    }

    async findById(id: number) {
        const result = await db
            .select(safeColumns)
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        return result[0] ?? null;
    }
    async create(user: User): Promise<PublicUser | null> {
        const result = await db
            .insert(users)
            .values(user)
            .returning(safeColumns)
        return result[0] ?? null;
    }
}