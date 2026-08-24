import {
    boolean,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    unique,
} from "drizzle-orm/pg-core";

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
export type CreateUser = {
    name: string;
    email: string;
    password: string;
    dialCode: string;
    mobile: string;
}

export type UpdateUser = {
    name?: string;
    email?: string;
    dialCode?: string;
    mobile?: string;
    isActive?: boolean
    role?:UserRoles,
    password?: string
}

export type UpdatePassword = {
    password: string
}
