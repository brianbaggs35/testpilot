import express, { Request, Response, NextFunction } from 'express';
import { registerRoutes } from './routes';
import { setupVite, serveStatic } from './vite';
import { Server } from 'http';
import { testDatabaseConnection } from './db';

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

  // Setup Vite dev server in development or serve static files in production
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
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