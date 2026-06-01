'use server';

import { db } from '@/lib/db';
import { trackMetric } from '@/lib/properties';

export interface OtpResult {
  success: boolean;
  message: string;
  codeForDev?: string; // Exposed ONLY in dev mode to make testing seamless
}

/**
 * Sends a simulated OTP code to a Costa Rican mobile number.
 */
export async function sendOtp(phone: string): Promise<OtpResult> {
  if (!phone || phone.length < 8) {
    return { success: false, message: 'Número de teléfono inválido. Debe tener al menos 8 dígitos.' };
  }

  try {
    // 1. Rate limiting check: check if code was sent within the last 60 seconds
    const existing = await db.phoneVerification.findUnique({
      where: { phone },
    });

    if (existing && existing.lastSentAt.getTime() > Date.now() - 60000) {
      const secondsLeft = Math.round((existing.lastSentAt.getTime() + 60000 - Date.now()) / 1000);
      return {
        success: false,
        message: `Por favor espere ${secondsLeft} segundos antes de solicitar otro código.`,
      };
    }

    // 2. Generate a random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // 3. Upsert verification record
    await db.phoneVerification.upsert({
      where: { phone },
      update: {
        code,
        expiresAt,
        attempts: 0,
        verified: false,
        lastSentAt: new Date(),
      },
      create: {
        phone,
        code,
        expiresAt,
        verified: false,
      },
    });

    // Track event
    await trackMetric('otp_sent', undefined, phone);

    // Mock logs for dev console only (avoid third-party SMS cost in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n========================================`);
      console.log(`[TicoHabitat OTP por WhatsApp]`);
      console.log(`Remitente: +506 60677055 (Bot de WhatsApp)`);
      console.log(`Destinatario: +506 ${phone}`);
      console.log(`Código OTP generado: ${code}`);
      console.log(`Expira en: 5 minutos (${expiresAt.toLocaleTimeString()})`);
      console.log(`========================================\n`);
    }

    return {
      success: true,
      message: 'Código de verificación enviado exitosamente (Simulado).',
      ...(process.env.NODE_ENV !== 'production' ? { codeForDev: code } : {}),
    };
  } catch (error) {
    console.error('Error in sendOtp:', error);
    return { success: false, message: 'Ocurrió un error al enviar el código de verificación.' };
  }
}

/**
 * Verifies an OTP code for a specific phone number.
 */
export async function verifyOtp(phone: string, code: string): Promise<OtpResult> {
  if (!phone || !code) {
    return { success: false, message: 'Teléfono y código son requeridos.' };
  }

  try {
    const record = await db.phoneVerification.findUnique({
      where: { phone },
    });

    if (!record) {
      return { success: false, message: 'No se encontró solicitud de verificación para este número.' };
    }

    if (record.verified) {
      return { success: true, message: 'Este número ya está verificado.' };
    }

    // Check expiry
    if (new Date() > record.expiresAt) {
      return { success: false, message: 'El código OTP ha expirado. Por favor, solicita uno nuevo.' };
    }

    // Check attempts limit (max 3)
    if (record.attempts >= 3) {
      return {
        success: false,
        message: 'Límite de intentos fallidos alcanzado. Solicita otro código.',
      };
    }

    // Check code
    if (record.code !== code) {
      // Increment attempts
      await db.phoneVerification.update({
        where: { phone },
        data: { attempts: { increment: 1 } },
      });

      return {
        success: false,
        message: `Código incorrecto. Intentos restantes: ${2 - record.attempts}`,
      };
    }

    // Success! Mark as verified
    await db.phoneVerification.update({
      where: { phone },
      data: { verified: true },
    });

    // Track event
    await trackMetric('otp_verified', undefined, phone);

    return {
      success: true,
      message: 'Teléfono verificado exitosamente. Ahora puedes publicar anuncios.',
    };
  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return { success: false, message: 'Ocurrió un error al verificar el código.' };
  }
}

/**
 * Verifica si un número de teléfono ya ha sido verificado y registrado por otra cuenta.
 */
export async function isPhoneAlreadyUsedAction(phone: string): Promise<{ exists: boolean }> {
  if (!phone) return { exists: false };
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 8) return { exists: false };

  try {
    const dbVerification = await db.phoneVerification.findUnique({
      where: { phone: cleanPhone },
    });

    return { exists: !!(dbVerification && dbVerification.verified) };
  } catch (error) {
    console.error('Error in isPhoneAlreadyUsedAction:', error);
    return { exists: false };
  }
}

