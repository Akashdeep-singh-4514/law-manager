import {
    boolean,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const adminRoleEnum = pgEnum("admin_role", [
    "super_admin",
    "admin",
]);

export const admins = pgTable("admins", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    role: adminRoleEnum("role").default("admin").notNull(),
    password: text("password").notNull(),
    isActive: boolean("is_active").default(true),
    devices: text("devices").array().default([]).notNull(),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});