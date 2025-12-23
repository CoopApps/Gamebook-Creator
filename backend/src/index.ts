import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

import { app } from './app';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import logger from './utils/logger';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    logger.info('🚀 Starting Gamebook API Server...');

    // Connect to databases
    logger.info('Connecting to databases...');
    await connectDatabase();
    await connectRedis();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('=================================');
      logger.info(`✅ Server running successfully!`);
      logger.info(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}`);
      logger.info(`🏥 Health: http://localhost:${PORT}/health`);
      logger.info(`📚 Docs: http://localhost:${PORT}/api-docs`);
      logger.info('=================================');
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} signal received: closing HTTP server`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connections
        try {
          const { disconnectDatabase } = await import('./config/database');
          const { disconnectRedis } = await import('./config/redis');

          await disconnectDatabase();
          await disconnectRedis();

          logger.info('All connections closed. Exiting process.');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
