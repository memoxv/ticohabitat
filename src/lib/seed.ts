import { db } from './db';
import { hashPassword } from './auth';

// Serverless container memory cache to fully eliminate redundant query overhead on subsequent page views!
const globalForSeeding = global as unknown as { isDbSeeded?: boolean };

export async function checkAndSeedDatabase() {
  if (globalForSeeding.isDbSeeded) {
    return; // Fast memory short-circuit
  }

  if (!process.env.DATABASE_URL) {
    console.warn('[TicoHabitat Warning] Database seeding skipped because DATABASE_URL is not configured.');
    return;
  }

  try {
    // Check if we already have the production admin
    const adminExists = await db.user.findFirst({
      where: { email: 'lleguele.grecia@gmail.com' },
    });

    if (adminExists) {
      globalForSeeding.isDbSeeded = true;
      return; // Already initialized
    }

    console.log('Seeding TicoHabitat production database...');

    const adminPassword = process.env.ADMIN_PASSWORD || 'Cristi@n2095';

    // Create production principal admin user
    await db.user.upsert({
      where: { email: 'lleguele.grecia@gmail.com' },
      update: {},
      create: {
        email: 'lleguele.grecia@gmail.com',
        name: 'Administrador Principal',
        password: await hashPassword(adminPassword), // Securely hashed with bcrypt
        role: 'ADMIN',
      },
    });

    globalForSeeding.isDbSeeded = true;
    console.log('Production database successfully seeded with main administrator!');
  } catch (error) {
    console.error('Error seeding production database:', error);
  }
}
