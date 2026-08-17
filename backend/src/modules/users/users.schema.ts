import {
    boolean,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";
import type { Static } from "elysia";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    isActive: boolean().notNull().default(true),
    dialCode: text("dialCode").notNull(),
    mobile: text("mobile").notNull(),
    devices: text("devices").array().default([]).notNull(),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    dialCodeMobileUnique: unique().on(table.dialCode, table.mobile),
}));

export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "password">;
export type NewUser = typeof users.$inferInsert;
export type CreateUser = {
    name: string;
    email: string;
    password: string;
    dialCode: string;
    mobile:string;
}

export type updateUser = {
    name?: string;
    email?: string;
    dialCode?: string;
    mobile?:string;
    isActive?:boolean
    password?:string
}

export type updatePassword={
    password:string
}