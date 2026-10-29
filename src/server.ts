/**
 * @file server.ts
 * @description Application entry point — connects to MongoDB, initialises the
 *              cache, wires Socket.io to the HTTP server and starts listening
 *              with graceful-shutdown guards.
 * @module Server
 * @author VehicleMarket Backend
 */

import http from 'http';
import app from './app';
import envConfig from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initCache, checkRedisConnection } from './config/redis';
import { initializeSocket } from './socket/index';
import logger from './logger/index';

const { port, environment } = envConfig.getServerConfig();

const bootstrap = async (): Promise<void> => {
  await connectDatabase();
  await initCache();

  const redisOk = await checkRedisConnection();
  logger.info(`Cache mode: ${redisOk ? 'redis' : 'in-memory fallback'}`, {
    fileName: 'server.ts',
    methodName: 'bootstrap',
  });

  const httpServer = http.createServer(app);
  initializeSocket(httpServer);

  httpServer.listen(port, () => {
    logger.info(`VehicleMarket API listening on port ${port} (${environment})`, {
      fileName: 'server.ts',
      methodName: 'bootstrap',
    });
    logger.info(`Swagger UI: http://localhost:${port}/api-docs`, {
      fileName: 'server.ts',
      methodName: 'bootstrap',
    });
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal} — shutting down gracefully`, {
      fileName: 'server.ts',
      methodName: 'shutdown',
    });
    httpServer.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Force-exit if graceful close hangs
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
};

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled promise rejection', {
    fileName: 'server.ts',
    methodName: 'unhandledRejection',
    reason: reason?.message || String(reason),
  });
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught exception — exiting', {
    fileName: 'server.ts',
    methodName: 'uncaughtException',
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

void bootstrap();

export default bootstrap;
