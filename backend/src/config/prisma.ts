import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/prisma/client.js';
import { env } from './env.js';
import { normalizePostgresConnectionString } from './postgres-connection.js';

const adapter = new PrismaPg({ connectionString: normalizePostgresConnectionString(env.DATABASE_URL) });

export const prisma = new PrismaClient({ adapter });
