import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Hardening database connection pool limit for Supabase session compatibility
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && !dbUrl.includes('connection_limit=')) {
  dbUrl = `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}connection_limit=3`;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: dbUrl
      ? {
          db: {
            url: dbUrl,
          },
        }
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

