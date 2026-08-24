CREATE TYPE "public"."user_roles" AS ENUM('super_admin', 'admin', 'user');--> statement-breakpoint
DROP TABLE "admins" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_roles" DEFAULT 'user' NOT NULL;--> statement-breakpoint
DROP TYPE "public"."admin_role";