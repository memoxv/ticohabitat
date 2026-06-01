'use server';

import { db } from '@/lib/db';
import { EmailService } from '@/lib/emailService';
import { getSession, setSession } from '@/lib/session';

export interface EmailOtpResult {
  success: boolean;
  message: string;
  codeForDev?: string; // Exposed ONLY in development/fallback mode to make testing seamless
}

/**
 * Generates a random 6-digit OTP code and dispatches it via Resend to the user's email.
 */
export async function sendEmailOtpAction(email: string): Promise<EmailOtpResult> {
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Dirección de correo electrónico inválida.' };
  }

  try {
    // 1. Rate limiting check: check if code was sent within the last 60 seconds
    const existing = await db.emailOtp.findUnique({
      where: { email },
    });

    if (existing && existing.lastSentAt.getTime() > Date.now() - 60000) {
      const secondsLeft = Math.round((existing.lastSentAt.getTime() + 60000 - Date.now()) / 1000);
      return {
        success: false,
        message: `Por favor espere ${secondsLeft} segundos antes de solicitar otro código OTP.`,
      };
    }

    // 2. Generate a random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // 3. Upsert OTP verification record
    await db.emailOtp.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        attempts: 0,
        verified: false,
        lastSentAt: new Date(),
      },
      create: {
        email,
        code,
        expiresAt,
        verified: false,
      },
    });

    // 4. Dispatch Email Template using Resend
    const html = EmailService.getEmailOtpTemplate(code, 5);
    const emailResult = await EmailService.sendEmail({
      to: email,
      subject: `Tu código de seguridad OTP: ${code} - TicoHabitat 🔑`,
      html,
    });

    return {
      success: emailResult.success,
      message: emailResult.success
        ? 'Código OTP de verificación enviado exitosamente por correo electrónico.'
        : `Error al despachar el código OTP: ${emailResult.message}`,
      ...(emailResult.mockSent ? { codeForDev: code } : {}), // Exposed in development mock mode for test verification
    };
  } catch (error) {
    console.error('Error in sendEmailOtpAction:', error);
    return { success: false, message: 'Ocurrió un error al despachar el código OTP.' };
  }
}

/**
 * Verifies a 6-digit OTP code for a specific user email.
 */
export async function verifyEmailOtpAction(email: string, code: string): Promise<EmailOtpResult> {
  if (!email || !code) {
    return { success: false, message: 'El correo y el código son obligatorios.' };
  }

  try {
    const record = await db.emailOtp.findUnique({
      where: { email },
    });

    if (!record) {
      return { success: false, message: 'No se encontró ninguna solicitud de verificación para este correo.' };
    }

    if (record.verified) {
      return { success: true, message: 'Este correo electrónico ya está verificado mediante OTP.' };
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      return { success: false, message: 'El código OTP ha expirado. Por favor, solicita uno nuevo.' };
    }

    // Check attempts limit (max 3)
    if (record.attempts >= 3) {
      return {
        success: false,
        message: 'Límite de intentos fallidos alcanzado. Solicita otro código OTP.',
      };
    }

    // Check code
    if (record.code !== code) {
      // Increment attempts
      await db.emailOtp.update({
        where: { email },
        data: { attempts: { increment: 1 } },
      });

      return {
        success: false,
        message: `Código OTP incorrecto. Intentos restantes: ${2 - record.attempts}`,
      };
    }

    // Success! Mark as verified in EmailOtp table
    await db.emailOtp.update({
      where: { email },
      data: { verified: true },
    });

    // CRITICAL BUG FIX: Also mark the corresponding user in the User table as verified!
    await db.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    // Revalidate and update the session cookie values on the server side
    const session = await getSession();
    if (session && session.email === email) {
      await setSession({
        ...session,
        emailVerified: true,
      });
    }

    return {
      success: true,
      message: 'Código de verificación verificado con éxito.',
    };
  } catch (error) {
    console.error('Error in verifyEmailOtpAction:', error);
    return { success: false, message: 'Ocurrió un error al verificar el código OTP.' };
  }
}
