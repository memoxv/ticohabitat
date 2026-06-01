import { cookies } from 'next/headers';
import { db } from './db';

const SESSION_COOKIE = 'ticohabitat_session';

export interface SessionData {
  userId: string;
  email: string;
  name?: string | null;
  role: 'USER' | 'ADMIN';
  verifiedPhone?: string | null;
  emailVerified: boolean;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }
  
  try {
    // Decode base64 session cookie
    const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
    const cookieData = JSON.parse(decoded) as SessionData;
    
    if (!cookieData.userId) {
      return null;
    }
    
    // Look up the user directly in the database to ensure absolute role integrity and prevent cookie spoofing!
    const dbUser = await db.user.findUnique({
      where: { id: cookieData.userId },
      select: { id: true, email: true, name: true, role: true, emailVerified: true }
    });
    
    if (!dbUser) {
      return null;
    }
    
    return {
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as 'USER' | 'ADMIN',
      verifiedPhone: cookieData.verifiedPhone,
      emailVerified: dbUser.emailVerified,
    };
  } catch (error) {
    return null;
  }
}

export async function setSession(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
  
  // Set httpOnly cookie for 30 days
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Session simulation for Client-side tracking
export async function getClientSessionAction() {
  return await getSession();
}
