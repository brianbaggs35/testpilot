import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerRoutes } from './routes.js';
import { testDatabaseConnection } from './db.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Test database connection
  try {
    await testDatabaseConnection();
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection failed:', error);
    // Continue anyway to allow setup without DB
  }

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Register API routes
  const server = await registerRoutes(app);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    
    // Serve index.html for all routes to support client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/build/index.html'));
    });
  }

  // Global error handler
  app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
      message: 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Start the server
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  return server;
}

// Start the application
main().catch(error => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});