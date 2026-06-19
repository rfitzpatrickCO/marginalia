CREATE TYPE "public"."format" AS ENUM('hardcover', 'paperback', 'ebook', 'audiobook');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('reading', 'toread', 'finished');--> statement-breakpoint
CREATE TABLE "books" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"series" text,
	"series_number" integer,
	"status" "status" DEFAULT 'toread' NOT NULL,
	"page_count" integer DEFAULT 0 NOT NULL,
	"current_page" integer DEFAULT 0 NOT NULL,
	"rating" double precision,
	"format" "format" DEFAULT 'hardcover' NOT NULL,
	"genres" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"language" text DEFAULT 'English' NOT NULL,
	"isbn" text,
	"cover_url" text,
	"tone" text,
	"notes" text DEFAULT '' NOT NULL,
	"review" text DEFAULT '' NOT NULL,
	"start_date" timestamp,
	"finish_date" timestamp,
	"reread_count" integer DEFAULT 0 NOT NULL,
	"queue_order" integer DEFAULT 0 NOT NULL,
	"date_added" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"text" text NOT NULL,
	"page" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"book_id" uuid NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"from_page" integer DEFAULT 0 NOT NULL,
	"to_page" integer DEFAULT 0 NOT NULL,
	"pages_read" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_sessions" ADD CONSTRAINT "reading_sessions_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;