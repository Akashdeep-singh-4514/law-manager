import {
    pgTable,
    serial,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "../users/users.schema";


export const genders = pgTable("genders", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    code:text("code").notNull().unique(),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
})

export const gendersRelations = relations(genders, ({ many }) => ({
    users: many(users),
}));

export type Gender = typeof genders.$inferSelect;

export type CreateGender = {
    name: string;
    code: string;
}