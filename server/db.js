const { Pool } = require('pg');

// Check for database connection string
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set. Using in-memory storage fallback.");
}

// Create PostgreSQL connection pool if database URL is available
const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL }) 
  : null;

// Test database connection
async function testDatabaseConnection() {
  if (!pool) {
    throw new Error('Database connection not initialized');
  }
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  testDatabaseConnection
};