import {
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { users } from "../users/users.schema";

export const refreshTokens = pgTable(
    "refresh_tokens",
    {
        id: uuid("id").primaryKey(),
        userId: integer("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),
        tokenHash: text("token_hash").notNull(),
        expiresAt: timestamp("expires_at").notNull(),
        revokedAt: timestamp("revoked_at"),
        replacedBy: uuid("replaced_by"),
        createdAt: timestamp("created_at")
            .defaultNow()
            .notNull(),
    },
    (table) => ({
        userIdIdx: index("refresh_tokens_user_id_idx").on(
            table.userId
        ),
    })
);

export type RefreshTokenRow =
    typeof refreshTokens.$inferSelect;
