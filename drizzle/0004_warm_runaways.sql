CREATE TABLE "random_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "random_chat_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vibe" varchar(20) DEFAULT 'random' NOT NULL,
	"age_min" integer DEFAULT 18 NOT NULL,
	"age_max" integer DEFAULT 30 NOT NULL,
	"gender_pref" varchar(10) DEFAULT 'everyone' NOT NULL,
	"interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "random_chat_queue_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "random_chat_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"reporter_id" integer NOT NULL,
	"reported_user_id" integer NOT NULL,
	"session_id" integer NOT NULL,
	"reason" varchar(40) NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "random_chat_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_a_id" integer NOT NULL,
	"user_b_id" integer NOT NULL,
	"alias_a" varchar(40) NOT NULL,
	"alias_b" varchar(40) NOT NULL,
	"vibe" varchar(20),
	"status" varchar(12) DEFAULT 'active' NOT NULL,
	"connection_requested_by_a" boolean DEFAULT false NOT NULL,
	"connection_requested_by_b" boolean DEFAULT false NOT NULL,
	"ended_by_user_id" integer,
	"ended_at" timestamp,
	"match_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "meetups" ADD COLUMN "require_approval" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "random_chat_messages" ADD CONSTRAINT "random_chat_messages_session_id_random_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."random_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_messages" ADD CONSTRAINT "random_chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_queue" ADD CONSTRAINT "random_chat_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_reports" ADD CONSTRAINT "random_chat_reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_reports" ADD CONSTRAINT "random_chat_reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_reports" ADD CONSTRAINT "random_chat_reports_session_id_random_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."random_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_sessions" ADD CONSTRAINT "random_chat_sessions_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_sessions" ADD CONSTRAINT "random_chat_sessions_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_sessions" ADD CONSTRAINT "random_chat_sessions_ended_by_user_id_users_id_fk" FOREIGN KEY ("ended_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "random_chat_sessions" ADD CONSTRAINT "random_chat_sessions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "random_chat_messages_session_idx" ON "random_chat_messages" USING btree ("session_id","id");--> statement-breakpoint
CREATE INDEX "random_chat_queue_expires_idx" ON "random_chat_queue" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "random_chat_reports_reported_idx" ON "random_chat_reports" USING btree ("reported_user_id");--> statement-breakpoint
CREATE INDEX "random_chat_sessions_a_status_idx" ON "random_chat_sessions" USING btree ("user_a_id","status");--> statement-breakpoint
CREATE INDEX "random_chat_sessions_b_status_idx" ON "random_chat_sessions" USING btree ("user_b_id","status");--> statement-breakpoint
CREATE INDEX "users_last_active_idx" ON "users" USING btree ("last_active_at");