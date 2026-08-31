import {
    boolean,
    integer,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { genders } from "../genders/gender.schema";

export enum UserRoles {
    SUPERADMIN = "super_admin",
    ADMIN = "admin",
    USER = "user"
}

export const UserRoleEnum = pgEnum("user_roles", UserRoles);

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    isActive: boolean().notNull().default(true),
    dialCode: text("dialCode").notNull(),
    role: UserRoleEnum("role").notNull().default(UserRoles.USER),
    mobile: text("mobile").notNull(),
    devices: text("devices").array().default([]).notNull(),
    genderId: integer("gender_id").references(() => genders.id, {
        onDelete: "set null",
    }),
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

export const usersRelations = relations(users, ({ one }) => ({
    gender: one(genders, {
        fields: [users.genderId],
        references: [genders.id],
    }),
}));

export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "password">;
export type CreateUser = {
    name: string;
    email: string;
    password: string;
    dialCode: string;
    mobile: string;
    genderId?: number;
}

export type UpdateUser = {
    name?: string;
    email?: string;
    dialCode?: string;
    mobile?: string;
    isActive?: boolean
    role?:UserRoles,
    password?: string
    genderId?: number;
}

export type UpdatePassword = {
    password: string
}