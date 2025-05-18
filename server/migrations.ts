import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // Create a PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create a drizzle instance using the pool and the schema
  const db = drizzle(pool);

  // Run migrations
  console.log('Running migrations...');
  
  try {
    // This will automatically create all tables based on your schema
    await db.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY NOT NULL,
        "role" varchar DEFAULT 'user' NOT NULL,
        "email" varchar UNIQUE,
        "username" varchar UNIQUE,
        "password_hash" varchar,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "preferences" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar PRIMARY KEY,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

      CREATE TABLE IF NOT EXISTS "test_runs" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "status" varchar NOT NULL,
        "environment" varchar,
        "type" varchar,
        "total_tests" integer,
        "passed_tests" integer,
        "failed_tests" integer,
        "skipped_tests" integer,
        "duration" integer,
        "started_at" timestamp NOT NULL,
        "completed_at" timestamp,
        "xml_data" text,
        "metadata" jsonb,
        "created_by_id" varchar REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "test_cases" (
        "id" serial PRIMARY KEY,
        "title" varchar NOT NULL,
        "description" text,
        "steps" text,
        "expected_result" text,
        "preconditions" text,
        "type" varchar NOT NULL,
        "status" varchar DEFAULT 'active',
        "priority" varchar,
        "tags" jsonb,
        "estimated_duration" integer,
        "automation_status" varchar,
        "automation_script" text,
        "metadata" jsonb,
        "created_by_id" varchar REFERENCES "users" ("id"),
        "last_modified_by_id" varchar REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "test_results" (
        "id" serial PRIMARY KEY,
        "test_run_id" integer REFERENCES "test_runs" ("id"),
        "test_case_id" integer REFERENCES "test_cases" ("id"),
        "class_name" varchar,
        "name" varchar,
        "status" varchar NOT NULL,
        "duration" integer,
        "error_message" text,
        "stack_trace" text,
        "screenshots" jsonb,
        "video_url" varchar,
        "metadata" jsonb,
        "executed_by_id" varchar REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "test_suites" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "description" text,
        "parent_id" integer REFERENCES "test_suites" ("id"),
        "path" varchar,
        "created_by_id" varchar REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "test_suites_test_cases" (
        "suite_id" integer NOT NULL REFERENCES "test_suites" ("id"),
        "test_case_id" integer NOT NULL REFERENCES "test_cases" ("id"),
        "order" integer,
        PRIMARY KEY ("suite_id", "test_case_id")
      );

      CREATE TABLE IF NOT EXISTS "test_plans" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "description" text,
        "status" varchar DEFAULT 'draft',
        "start_date" timestamp,
        "end_date" timestamp,
        "created_by_id" varchar REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "test_plans_test_cases" (
        "plan_id" integer NOT NULL REFERENCES "test_plans" ("id"),
        "test_case_id" integer NOT NULL REFERENCES "test_cases" ("id"),
        "assigned_to_id" varchar REFERENCES "users" ("id"),
        "status" varchar,
        "notes" text,
        "order" integer,
        PRIMARY KEY ("plan_id", "test_case_id")
      );

      CREATE TABLE IF NOT EXISTS "failure_tracking" (
        "id" serial PRIMARY KEY,
        "test_result_id" integer REFERENCES "test_results" ("id"),
        "title" varchar NOT NULL,
        "description" text,
        "status" varchar DEFAULT 'new',
        "priority" varchar,
        "assigned_to_id" varchar REFERENCES "users" ("id"),
        "jira_ticket_id" varchar,
        "resolved_by_id" varchar REFERENCES "users" ("id"),
        "resolved_at" timestamp,
        "resolution" text,
        "created_by_id" varchar REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" serial PRIMARY KEY,
        "user_id" varchar NOT NULL REFERENCES "users" ("id"),
        "title" varchar NOT NULL,
        "message" text NOT NULL,
        "type" varchar,
        "read" boolean DEFAULT false,
        "link" varchar,
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "report_templates" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "description" text,
        "template" text NOT NULL,
        "created_by_id" varchar REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "reports" (
        "id" serial PRIMARY KEY,
        "name" varchar NOT NULL,
        "description" text,
        "template_id" integer REFERENCES "report_templates" ("id"),
        "content" text NOT NULL,
        "format" varchar DEFAULT 'html',
        "filters" jsonb,
        "created_by_id" varchar REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "comments" (
        "id" serial PRIMARY KEY,
        "test_case_id" integer NOT NULL REFERENCES "test_cases" ("id"),
        "parent_id" integer REFERENCES "comments" ("id"),
        "content" text NOT NULL,
        "author_id" varchar NOT NULL REFERENCES "users" ("id"),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration function
main().catch(console.error);