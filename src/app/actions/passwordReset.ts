'use server';

import { db } from '@/lib/db';
import { EmailService } from '@/lib/emailService';
import { hashPassword } from '@/lib/auth';
import crypto from 'crypto';

export interface PasswordResetResult {
  success: boolean;
  message: string;
  resetLink?: string; // Exposed ONLY in development/fallback mode to make testing seamless
}

/**
 * Initiates the password recovery flow by generating a secure token and sending a recovery email via Resend.
 */
export async function requestPasswordResetAction(email: string): Promise<PasswordResetResult> {
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Dirección de correo electrónico inválida.' };
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Security best practice: do not explicitly state if user exists or not to prevent user enumeration attacks.
      // However, for this MVP and launch, we return a general friendly success confirmation.
      return {
        success: true,
        message: 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña en unos momentos.',
      };
    }

    // Generate secure recovery token (32 bytes hex)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

    // Save tokens in database
    await db.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const resetLink = `${appUrl}/restablecer?token=${token}`;

    // Generate responsive HTML template
    const html = EmailService.getPasswordRecoveryTemplate(user.name || 'Usuario TicoHabitat', resetLink);

    // Send recovery email using Resend
    const emailResult = await EmailService.sendEmail({
      to: email,
      subject: 'Restablecé tu contraseña - TicoHabitat 🔒',
      html,
    });

    return {
      success: emailResult.success,
      message: emailResult.success
        ? 'Si el correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña en unos momentos.'
        : `Error al despachar el correo de recuperación: ${emailResult.message}`,
      ...(emailResult.mockSent ? { resetLink } : {}), // Exposed ONLY in local fallback mode for QA testing
    };
  } catch (error) {
    console.error('Error in requestPasswordResetAction:', error);
    return { success: false, message: 'Ocurrió un error al procesar la solicitud de recuperación.' };
  }
}

/**
 * Resets a user's password using a valid recovery token and securely hashes the new password with Bcrypt.
 */
export async function resetPasswordAction(token: string, newPassword: string): Promise<PasswordResetResult> {
  if (!token) {
    return { success: false, message: 'Token de restablecimiento obligatorio.' };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  try {
    const user = await db.user.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      return { success: false, message: 'El enlace de restablecimiento es inválido o ya fue utilizado.' };
    }

    // Verify token expiration
    if (user.resetPasswordExpiresAt && new Date() > user.resetPasswordExpiresAt) {
      return { success: false, message: 'El enlace de restablecimiento ha expirado. Solicita uno nuevo.' };
    }

    // Securely hash the new password using bcrypt
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset tokens in database
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    return {
      success: true,
      message: 'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.',
    };
  } catch (error) {
    console.error('Error in resetPasswordAction:', error);
    return { success: false, message: 'Ocurrió un error interno al intentar restablecer tu contraseña.' };
  }
}
