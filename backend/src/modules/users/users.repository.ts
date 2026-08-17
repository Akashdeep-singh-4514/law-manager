import { db } from "../../db";
import { users, type CreateUser, type PublicUser, type updateUser } from "./users.schema";
import { and, eq, getTableColumns } from "drizzle-orm";


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

    async findByEmail(email: string) {
        const result = await db
            .select(safeColumns)
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        return result[0] ?? null;
    }

    async findByMobile(dialCode: string, mobile: string) {
        const result = await db
            .select(safeColumns)
            .from(users)
            .where(and(eq(users.dialCode, dialCode), eq(users.mobile, mobile)))
            .limit(1);

        return result[0] ?? null;
    }

    async create(user: CreateUser): Promise<PublicUser | null> {
        const result = await db
            .insert(users)
            .values(user)
            .returning(safeColumns)
        return result[0] ?? null;
    }

    async update(
        id: number,
        user: updateUser
    ): Promise<PublicUser | null> {
        const result = await db
            .update(users)
            .set(user)
            .where(eq(users.id, id))
            .returning(safeColumns);

        return result[0] ?? null;
    }
}