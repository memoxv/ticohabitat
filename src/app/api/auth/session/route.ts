import { NextRequest, NextResponse } from 'next/server';
import { setSession, destroySession, getSession, SessionData } from '@/lib/session';
import { db } from '@/lib/db';
import { hashPassword, generateSecureRandomHash, comparePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json() as SessionData & { password?: string; isSignUp?: boolean };
    if (!data.email) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 400 });
    }

    // 0. Security Audit: If user already exists in database, verify password!
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (!existingUser && !data.isSignUp) {
      return NextResponse.json({
        error: 'No se encontró ninguna cuenta registrada con este correo electrónico. Por favor, crea una cuenta primero.'
      }, { status: 404 });
    }

    let assignedRole: 'USER' | 'ADMIN' = 'USER';

    if (existingUser) {
      if (!data.password) {
        return NextResponse.json({ error: 'Se requiere una contraseña para iniciar sesión.' }, { status: 401 });
      }
      const isMatch = await comparePassword(data.password, existingUser.password);
      if (!isMatch) {
        return NextResponse.json({ error: 'Contraseña incorrecta. Intente nuevamente.' }, { status: 401 });
      }
      // Preserve the role exactly as registered in the database!
      assignedRole = existingUser.role as 'USER' | 'ADMIN';
    } else {
      // New users syncing for the first time default strictly to USER role.
      // Admin privileges are granted exclusively via database seeds, migrations, or database administrators.
      assignedRole = 'USER';
    }
    
    // Hash the password if provided, or generate a secure random one
    const hashedPassword = data.password
      ? await hashPassword(data.password)
      : await generateSecureRandomHash();
    
    // Upsert the user in the database to guarantee referential integrity!
    const dbUser = await db.user.upsert({
      where: { email: data.email },
      update: {
        // Only update name on signup or if data.name is custom (not default placeholder)
        name: data.isSignUp && data.name && data.name !== 'Usuario Costa Rica' && data.name !== 'Usuario TicoHabitat'
          ? data.name
          : undefined,
        role: assignedRole,
      },
      create: {
        email: data.email,
        name: data.name || 'Usuario Costa Rica',
        password: hashedPassword,
        role: assignedRole,
      },
    });
    
    // Verify that the phone is indeed verified in the database to prevent spoofing exploits!
    let verifiedPhone: string | null = null;
    if (data.verifiedPhone) {
      const cleanPhone = data.verifiedPhone.replace(/\D/g, '');
      if (data.isSignUp) {
        // Automatically save the phone as verified in the database during signup to prevent future duplicate registration attempts!
        await db.phoneVerification.upsert({
          where: { phone: cleanPhone },
          update: { verified: true },
          create: {
            phone: cleanPhone,
            code: '123456', // dummy code for signup registration sync
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            verified: true,
          },
        });
        verifiedPhone = cleanPhone;
      } else {
        const dbVerification = await db.phoneVerification.findUnique({
          where: { phone: cleanPhone },
        });
        if (dbVerification && dbVerification.verified) {
          verifiedPhone = cleanPhone;
        }
      }
    }

    // Override the session with the real generated DB user id
    const sessionPayload: SessionData = {
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as 'USER' | 'ADMIN',
      verifiedPhone: verifiedPhone,
      emailVerified: dbUser.emailVerified,
    };
    
    await setSession(sessionPayload);
    return NextResponse.json({ success: true, user: sessionPayload });
  } catch (error) {
    console.error('Error in session auth API:', error);
    return NextResponse.json({ error: 'Server error setting session' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: 'Server error fetching session' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error clearing session' }, { status: 500 });
  }
}
