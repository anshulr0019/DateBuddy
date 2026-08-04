-- Incremental migration for the security pass.
-- Safe to run against an existing populated database (idempotent).
-- Run this INSTEAD of 0000_fixed_kingpin.sql if your DB already has tables.

CREATE TABLE IF NOT EXISTS "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "otp_codes_phone_idx" ON "otp_codes" USING btree ("phone_number");

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" varchar(100);
ALTER TABLE "users" ALTER COLUMN "phone_number" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_google_id_unique" ON "users" ("google_id");

-- Required for onConflictDoNothing() to actually suppress duplicates.
-- If these fail, existing duplicate rows must be removed first.
CREATE UNIQUE INDEX IF NOT EXISTS "swipes_swiper_swiped_unique" ON "swipes" ("swiper_id","swiped_id");
CREATE UNIQUE INDEX IF NOT EXISTS "matches_pair_unique" ON "matches" ("user1_id","user2_id");
CREATE UNIQUE INDEX IF NOT EXISTS "meetup_attendees_unique" ON "meetup_attendees" ("meetup_id","user_id");
