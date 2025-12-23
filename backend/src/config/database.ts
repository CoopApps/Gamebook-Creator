import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ]
    : ['error'],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug('Query:', e.query);
    logger.debug('Duration:', e.duration + 'ms');
  });
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database health check passed');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

export default prisma;
