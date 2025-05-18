import pkg from 'pg';
const { Pool } = pkg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to test the database connection
export async function testDatabaseConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  } finally {
    client.release();
  }
}

// Function to initialize the database schema
export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Check if tables already exist - if users table exists, we assume database is initialized
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
      );
    `);
    
    const tablesExist = tableCheck.rows[0].exists;
    
    if (tablesExist) {
      console.log('Database tables already exist, skipping initialization');
      return true;
    }
    
    console.log('Initializing database tables...');

    // Create users table
    await client.query(`
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
    `);
    
    // Create sessions table for authentication
    await client.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar PRIMARY KEY,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
      );

      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
    `);
    
    // Create test_runs table
    await client.query(`
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
    `);
    
    // Create test_cases table
    await client.query(`
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
    `);
    
    // Create basic demo data
    // Create a demo admin user
    const adminExists = await client.query(`
      SELECT * FROM users WHERE id = '1' LIMIT 1
    `);
    
    if (adminExists.rowCount === 0) {
      await client.query(`
        INSERT INTO users (id, email, role, first_name, last_name)
        VALUES ('1', 'admin@testpilot.com', 'admin', 'Admin', 'User')
      `);
      
      // Create some sample test cases
      try {
        await client.query(`
          INSERT INTO test_cases (title, description, type, status, priority, created_by_id)
          VALUES 
          ('Login functionality', 'Verify that users can login with valid credentials', 'manual', 'active', 'high', '1'),
          ('User registration', 'Test the user registration process', 'manual', 'active', 'high', '1'),
          ('Password reset', 'Verify password reset functionality works as expected', 'manual', 'active', 'medium', '1'),
          ('Search functionality', 'Test the search feature with various inputs', 'manual', 'active', 'medium', '1'),
          ('API Authentication', 'Verify API authentication works correctly', 'automated', 'active', 'high', '1')
        `);
        console.log('Test cases created successfully');
      } catch (error) {
        console.error('Error creating test cases:', error);
      }
      
      // Create a sample test run
      try {
        await client.query(`
          INSERT INTO test_runs (name, status, environment, total_tests, passed_tests, failed_tests, skipped_tests, started_at, created_by_id)
          VALUES ('Nightly Build Test', 'completed', 'production', 120, 105, 10, 5, now(), '1')
        `);
        console.log('Test run created successfully');
      } catch (error) {
        console.error('Error creating test run:', error);
      }
      
      console.log('Demo data creation completed');
    }
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  } finally {
    client.release();
  }
}

// Function to fetch test cases from the database
export async function fetchTestCases(limit = 10) {
  try {
    const result = await pool.query('SELECT * FROM test_cases ORDER BY created_at DESC LIMIT $1', [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching test cases:', error);
    return [];
  }
}

// Function to fetch test runs from the database
export async function fetchTestRuns(limit = 10) {
  try {
    const result = await pool.query('SELECT * FROM test_runs ORDER BY created_at DESC LIMIT $1', [limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching test runs:', error);
    return [];
  }
}

// Function to fetch a user by username
export async function fetchUserByUsername(username) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}