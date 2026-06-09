import { headers } from 'next/headers';

/**
 * Dynamically resolves the absolute base URL of the application at runtime
 * using the request host headers to avoid hardcoded domain issues.
 */
export async function getAbsoluteAppUrl(): Promise<string> {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    if (host) {
      const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
      return `${protocol}://${host}`;
    }
  } catch (error) {
    // Fail-safe fallback in static contexts or edge cases
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://www.ticohabitat.com';
}
