import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../db";
import { refreshTokens } from "./refresh.schema";

export class RefreshTokenRepository {
    async create(data: { id: string; userId: number; tokenHash: string; expiresAt: Date }) {
        const [token] = await db.insert(refreshTokens).values(data).returning();
        return token;
    }

    async findById(id: string) {
        const [token] = await db
            .select()
            .from(refreshTokens)
            .where(eq(refreshTokens.id, id))
            .limit(1);

        return token;
    }

    async findValidToken(id: string) {
        const [token] = await db
            .select()
            .from(refreshTokens)
            .where(and(eq(refreshTokens.id, id), isNull(refreshTokens.revokedAt)))
            .limit(1);

        return token;
    }

    async revoke(id: string, replacedBy?: string) {
        const [token] = await db
            .update(refreshTokens)
            .set({
                revokedAt: new Date(),
                replacedBy: replacedBy ?? null,
            })
            .where(eq(refreshTokens.id, id))
            .returning();

        return token;
    }

    async revokeAllForUser(userId: number) {
        return db
            .update(refreshTokens)
            .set({
                revokedAt: new Date(),
            })
            .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
    }

    async delete(id: string) {
        return db.delete(refreshTokens).where(eq(refreshTokens.id, id));
    }
}
