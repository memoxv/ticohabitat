import { db } from './db';

/**
 * Persistently logs an error to the database SystemLog table
 * and to the standard error logs for Vercel/Hostinger collection.
 * Designed to be fire-and-forget so it never blocks the user.
 */
export async function logSystemError(context: string, error: any, metadata?: any) {
  try {
    if (!process.env.DATABASE_URL) return;

    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : null;

    let metaStr = null;
    if (metadata) {
      metaStr = typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata);
    }

    await db.systemLog.create({
      data: {
        level: 'ERROR',
        context,
        message,
        stack,
        metadata: metaStr,
      },
    });

    console.error(`[SystemLog ERROR] Context: ${context} | Message: ${message}`);
  } catch (err) {
    console.error('CRITICAL: Failed to write system log to database:', err);
  }
}

/**
 * Persistently logs a warning to the database SystemLog table.
 */
export async function logSystemWarn(context: string, message: string, metadata?: any) {
  try {
    if (!process.env.DATABASE_URL) return;

    let metaStr = null;
    if (metadata) {
      metaStr = typeof metadata === 'object' ? JSON.stringify(metadata) : String(metadata);
    }

    await db.systemLog.create({
      data: {
        level: 'WARN',
        context,
        message,
        metadata: metaStr,
      },
    });

    console.warn(`[SystemLog WARN] Context: ${context} | Message: ${message}`);
  } catch (err) {
    console.error('CRITICAL: Failed to write system log to database:', err);
  }
}
