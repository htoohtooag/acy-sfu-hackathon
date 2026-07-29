import type { Server } from 'node:http';
import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

let httpServer: Server | undefined;
let isShuttingDown = false;

async function startServer(): Promise<void> {
  await prisma.$connect();

  httpServer = app.listen(env.PORT, () => {
    console.log(`Backend listening on port  http://localhost:${env.PORT}.`);
  });
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}, shutting down.`);

  await new Promise<void>((resolve, reject) => {
    if (!httpServer) {
      resolve();
      return;
    }

    httpServer.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await prisma.$disconnect();
}

process.once('SIGINT', () => {
  void shutdown('SIGINT').catch((error: unknown) => {
    console.error('Shutdown failed.', error);
    process.exitCode = 1;
  });
});

process.once('SIGTERM', () => {
  void shutdown('SIGTERM').catch((error: unknown) => {
    console.error('Shutdown failed.', error);
    process.exitCode = 1;
  });
});

startServer().catch(async (error: unknown) => {
  console.error('Backend startup failed.', error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
