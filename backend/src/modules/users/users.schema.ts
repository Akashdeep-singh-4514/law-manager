import {
    boolean,
    pgTable,
    serial,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    isActive: boolean(),
    devices: text("devices").array().default([]).notNull(),
    createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "password">;
export type NewUser = typeof users.$inferInsert;
export type CreateUser={
    name: string;
    email:string;
    password: string;
}