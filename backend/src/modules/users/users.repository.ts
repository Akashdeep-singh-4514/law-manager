import { db } from "../../db";
import { users, type CreateUser, type PublicUser, type UpdateUser, type User } from "./users.schema";
import { and, eq, getTableColumns } from "drizzle-orm";

const allColumns = getTableColumns(users);

const safeColumns = Object.fromEntries(
    Object.entries(allColumns).filter(([key]) => key !== "password"),
);

export class UsersRepository {
    async findAll(): Promise<PublicUser[] | null> {
        const result = await db.select(safeColumns).from(users);
        return result as PublicUser[];
    }

    async findById(id: number): Promise<PublicUser | null> {
        const result = await db.select(safeColumns).from(users).where(eq(users.id, id)).limit(1);

        return (result[0] as PublicUser) ?? null;
    }

    async findByEmail(email: string): Promise<PublicUser | null> {
        const result = await db
            .select(safeColumns)
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        return (result[0] as PublicUser) ?? null;
    }
    async findByEmailUnsafe(email: string): Promise<User | null> {
        const result = await db
            .select(allColumns)
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        return (result[0] as User) ?? null;
    }

    async findByPhoneUnsafe(dialCode: string, mobile: string): Promise<User | null> {
        const result = await db
            .select(allColumns)
            .from(users)
            .where(and(eq(users.dialCode, dialCode), eq(users.mobile, mobile)))
            .limit(1);

        return (result[0] as User) ?? null;
    }

    async findByMobile(dialCode: string, mobile: string): Promise<PublicUser | null> {
        const result = await db
            .select(safeColumns)
            .from(users)
            .where(and(eq(users.dialCode, dialCode), eq(users.mobile, mobile)))
            .limit(1);

        return (result[0] as PublicUser) ?? null;
    }

    async create(user: CreateUser): Promise<PublicUser | null> {
        const result = await db.insert(users).values(user).returning(safeColumns);
        return (result[0] as PublicUser) ?? null;
    }

    async update(id: number, user: UpdateUser): Promise<PublicUser | null> {
        const result = await db
            .update(users)
            .set(user)
            .where(eq(users.id, id))
            .returning(safeColumns);

        return (result[0] as PublicUser) ?? null;
    }

    async delete(id: number): Promise<PublicUser | null> {
        const result = await db.delete(users).where(eq(users.id, id)).returning(safeColumns);

        return (result[0] as PublicUser) ?? null;
    }
}
