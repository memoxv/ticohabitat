'use server';

import { db } from '@/lib/db';
import { getSession, setSession } from '@/lib/session';
import { EmailService } from '@/lib/emailService';
import crypto from 'crypto';

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  verificationLink?: string; // Exposed in development/beta for testing purposes
}

/**
 * Generates a cryptographically secure verification token and dispatches an HTML email using Resend.
 */
export async function sendEmailVerification(): Promise<EmailVerificationResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Debe iniciar sesión para solicitar la verificación por correo.' };
  }

  try {
    // Generate secure cryptographical token (32 bytes hex)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Expires in 24 hours

    // Update user record in database
    await db.user.update({
      where: { id: session.userId },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const verificationLink = `${appUrl}/verify-email?token=${token}`;

    // Generate responsive HTML template
    const html = EmailService.getEmailVerificationTemplate(session.name || 'Anunciante TicoHabitat', verificationLink);

    // Send email using our centralized Resend Service!
    const emailResult = await EmailService.sendEmail({
      to: session.email,
      subject: 'Validá tu dirección de correo electrónico - TicoHabitat 🇨🇷',
      html,
    });

    return {
      success: emailResult.success,
      message: emailResult.success 
        ? 'Correo de verificación enviado exitosamente. Revise su bandeja de entrada.' 
        : `No se pudo enviar el correo: ${emailResult.message}`,
      ...(emailResult.mockSent ? { verificationLink } : {}), // Expose the link ONLY if running in simulated fallback mode
    };
  } catch (error) {
    console.error('Error in sendEmailVerification:', error);
    return { success: false, message: 'Ocurrió un error al procesar la solicitud de verificación.' };
  }
}

/**
 * Validates a secure email verification token and marks the corresponding user as verified.
 */
export async function verifyEmailAction(token: string): Promise<EmailVerificationResult> {
  if (!token) {
    return { success: false, message: 'El token de verificación es obligatorio.' };
  }

  try {
    // 1. Defensive Check: If the current logged-in user is already verified, return success directly
    const session = await getSession();
    if (session) {
      const dbUser = await db.user.findUnique({
        where: { id: session.userId },
        select: { emailVerified: true },
      });
      if (dbUser?.emailVerified) {
        return {
          success: true,
          message: 'Tu dirección de correo electrónico ya ha sido verificado con éxito. ¡Ya puedes publicar tus anuncios!',
        };
      }
    }

    // Find the user with the matching active verification token
    const user = await db.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return { success: false, message: 'El enlace de verificación no es válido o ya fue utilizado.' };
    }

    // Verify token expiration
    if (user.emailVerificationExpiresAt && new Date() > user.emailVerificationExpiresAt) {
      return { success: false, message: 'El enlace de verificación ha expirado. Por favor, solicita uno nuevo.' };
    }

    // Mark as verified and clear token columns in database
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    });

    // Revalidate and update the session cookie values on the server side
    if (session && session.userId === updatedUser.id) {
      await setSession({
        ...session,
        emailVerified: true,
      } as any);
    }

    return {
      success: true,
      message: 'Tu correo electrónico ha sido verificado con éxito. ¡Ya puedes publicar tus anuncios!',
    };
  } catch (error) {
    console.error('Error in verifyEmailAction:', error);
    return { success: false, message: 'Ocurrió un error interno al verificar tu dirección de correo electrónico.' };
  }
}
