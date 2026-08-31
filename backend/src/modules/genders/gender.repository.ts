import { db } from "../../db";
import { eq, getTableColumns } from "drizzle-orm";
import { genders, type CreateGender, type Gender } from "./gender.schema";

const allColumns = getTableColumns(genders);

export class GendersRepository {
    async findAll(): Promise<Gender[] | null> {
        const result = await db.select(allColumns).from(genders);
        return result as Gender[];
    }

    async findById(id: number): Promise<Gender | null> {
        const result = await db.select(allColumns).from(genders).where(eq(genders.id, id)).limit(1);

        return (result[0] as Gender) ?? null;
    }
    async create(data: CreateGender): Promise<Gender | null> {
        const result = await db.insert(genders).values(data).returning(allColumns);
        return (result[0] as Gender) ?? null;
    }

    async update(id: number, data: CreateGender): Promise<Gender | null> {
        const result = await db
            .update(genders)
            .set(data)
            .where(eq(genders.id, id))
            .returning(allColumns);

        return (result[0] as Gender) ?? null;
    }

    async delete(id: number): Promise<Gender | null> {
        const result = await db.delete(genders).where(eq(genders.id, id)).returning(allColumns);

        return (result[0] as Gender) ?? null;
    }
    async findByCode(code: string): Promise<Gender | null> {
        const result = await db
            .select(allColumns)
            .from(genders)
            .where(eq(genders.code, code))
            .limit(1);

        return (result[0] as Gender) ?? null;
    }
}
