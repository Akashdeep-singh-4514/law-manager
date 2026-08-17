ALTER TABLE "users" ALTER COLUMN "isActive" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "isActive" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dialCode" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mobile" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_dialCode_mobile_unique" UNIQUE("dialCode","mobile");