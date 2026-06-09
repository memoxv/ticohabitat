import crypto from 'crypto';

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static getApiKey(): string | undefined {
    return process.env.RESEND_API_KEY;
  }

  private static getFromEmail(): string {
    return process.env.RESEND_FROM_EMAIL || 'TicoHabitat <onboarding@resend.dev>';
  }

  /**
   * Dispatches an email using Resend API.
   * If RESEND_API_KEY is not defined, it acts as a mock/fallback service for seamless development.
   */
  public static async sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; message: string; mockSent?: boolean }> {
    const apiKey = this.getApiKey();
    const from = this.getFromEmail();

    if (!apiKey) {
      // PRODUCTION GUARD: Prevent silent simulation failures in live environments
      if (process.env.NODE_ENV === 'production') {
        console.error('[CRITICAL SECURITY ERROR] Transactional mail system: RESEND_API_KEY is missing in production!');
        return {
          success: false,
          message: 'Error de infraestructura transaccional: Sistema de correo no configurado.',
        };
      }

      // DEVELOPMENT / QA FALLBACK
      console.log(`\n========================================`);
      console.log(`[TicoHabitat CORREO SIMULADO (MOCK)]`);
      console.log(`Remitente: ${from}`);
      console.log(`Destinatario: ${payload.to}`);
      console.log(`Asunto: ${payload.subject}`);
      console.log(`Cuerpo HTML (Breve): ${payload.html.substring(0, 300)}...`);
      console.log(`========================================\n`);

      return {
        success: true,
        message: 'Correo simulado despachado con éxito (Falta RESEND_API_KEY en entorno).',
        mockSent: true,
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: `Correo enviado con éxito. ID: ${data.id || 'N/A'}` };
      } else {
        console.error('Resend API Error details:', data);
        return { success: false, message: `Error de API de Resend: ${data.message || 'Error desconocido'}` };
      }
    } catch (error) {
      console.error('Network error dispatching email via Resend:', error);
      return { success: false, message: 'Ocurrió un error de red al intentar enviar el correo.' };
    }
  }

  /**
   * Generates a premium dark-themed HTML template.
   */
  private static getBaseHtmlTemplate(title: string, innerHtml: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      background-color: #0d1210;
      color: #f4f6f5;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0d1210;
      padding: 40px 0;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #131a17;
      border: 1px solid #1f2a24;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    .header {
      padding: 40px 30px 20px 30px;
      text-align: center;
      background-image: linear-gradient(to bottom, #131a17, #0f1613);
    }
    .logo-img {
      height: 48px;
      width: auto;
      margin-bottom: 15px;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #f4f6f5;
      margin: 0;
    }
    .brand-accent {
      color: #34d399;
    }
    .content {
      padding: 30px 40px;
      text-align: left;
      line-height: 1.6;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 15px;
      letter-spacing: -0.01em;
    }
    p {
      font-size: 14px;
      color: #8e9e95;
      margin-bottom: 20px;
    }
    .btn-container {
      text-align: center;
      margin: 35px 0;
    }
    .btn-action {
      display: inline-block;
      background-color: #34d399;
      color: #0d1210 !important;
      text-decoration: none;
      font-size: 13px;
      font-weight: 800;
      padding: 14px 28px;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(52,211,153,0.25);
      transition: background-color 0.2s;
    }
    .btn-action:hover {
      background-color: #059669;
    }
    .otp-code-box {
      background-color: #1a2720;
      border: 1px dashed #34d399;
      border-radius: 12px;
      padding: 15px 30px;
      text-align: center;
      margin: 30px auto;
      max-width: 250px;
    }
    .otp-code-text {
      font-family: 'Courier New', Courier, monospace;
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 0.15em;
      color: #34d399;
      margin: 0;
    }
    .footer {
      padding: 25px 40px;
      background-color: #0f1613;
      border-t: 1px solid #1f2a24;
      text-align: center;
      font-size: 11px;
      color: #4f5f56;
    }
    .footer a {
      color: #8e9e95;
      text-decoration: underline;
    }
    .divider {
      border: 0;
      height: 1px;
      background: #1f2a24;
      margin: 25px 0;
    }
    .fineprint {
      font-size: 11px;
      color: #4f5f56;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://www.ticohabitat.com/logo-icon.png" alt="TicoHabitat" class="logo-img" onerror="this.style.display='none'">
        <div class="brand-title">Tico<span class="brand-accent">Habitat</span></div>
      </div>
      <div class="content">
        ${innerHtml}
      </div>
      <div class="footer">
        Este mensaje fue enviado de manera automática por TicoHabitat Costa Rica.<br>
        © 2026 TicoHabitat S.A. Todos los derechos reservados.<br>
        <span class="fineprint">Grecia, Alajuela, Costa Rica.</span>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generates email verification template.
   */
  public static getEmailVerificationTemplate(name: string, link: string): string {
    const innerHtml = `
      <h1>Verificá tu Correo Electrónico</h1>
      <p>Hola, <strong>${name}</strong>.</p>
      <p>Te damos una cálida bienvenida a <strong>TicoHabitat</strong>, el portal de búsqueda de hogares más seguro y natural de Costa Rica.</p>
      <p>Para completar tu registro y habilitar la publicación instantánea de anuncios sin requerir OTP telefónico, hacé clic en el botón inferior para verificar tu dirección de correo:</p>
      
      <div class="btn-container">
        <a href="${link}" class="btn-action" target="_blank">Verificar Mi Correo</a>
      </div>

      <p>Si el botón no funciona, podés copiar y pegar el siguiente enlace en tu navegador:</p>
      <p class="fineprint" style="word-break: break-all;"><a href="${link}">${link}</a></p>
      
      <hr class="divider">
      <p class="fineprint">Este enlace de verificación es de un solo uso y expirará en 24 horas. Si vos no creaste una cuenta, podés ignorar este correo de forma segura.</p>
    `;
    return this.getBaseHtmlTemplate('Verificación de Correo - TicoHabitat', innerHtml);
  }

  /**
   * Generates email OTP template.
   */
  public static getEmailOtpTemplate(code: string, expiresMinutes = 5): string {
    const innerHtml = `
      <h1>Tu Código de Seguridad</h1>
      <p>Hola.</p>
      <p>Estás intentando realizar una operación sensible en <strong>TicoHabitat</strong> (como publicar un anuncio o iniciar sesión). Para garantizar tu seguridad y legitimidad, utilizá el siguiente código de un solo uso (OTP):</p>
      
      <div class="otp-code-box">
        <div class="otp-code-text">${code}</div>
      </div>

      <p style="text-align: center; font-size: 12px; color: #8e9e95;">
        Este código expira en <strong>${expiresMinutes} minutos</strong> y solo sirve para esta solicitud.
      </p>

      <hr class="divider">
      <p class="fineprint"><strong>¿No solicitaste este código?</strong> Si vos no estabas navegando o no solicitaste esta validación, te recomendamos cambiar tu contraseña de inmediato para resguardar tu cuenta.</p>
    `;
    return this.getBaseHtmlTemplate('Código OTP de Seguridad - TicoHabitat', innerHtml);
  }

  /**
   * Generates password recovery/reset template.
   */
  public static getPasswordRecoveryTemplate(name: string, link: string): string {
    const innerHtml = `
      <h1>Restablecé tu Contraseña</h1>
      <p>Hola, <strong>${name}</strong>.</p>
      <p>Recibimos una solicitud para restablecer la contraseña de acceso asociada a tu cuenta en <strong>TicoHabitat</strong>.</p>
      <p>Para introducir una nueva contraseña segura, hacé clic en el botón de abajo:</p>
      
      <div class="btn-container">
        <a href="${link}" class="btn-action" target="_blank">Restablecer Contraseña</a>
      </div>

      <p>Si el botón no funciona, podés copiar y pegar el siguiente enlace en tu navegador:</p>
      <p class="fineprint" style="word-break: break-all;"><a href="${link}">${link}</a></p>
      
      <hr class="divider">
      <p class="fineprint">Este enlace de restauración expirará en 1 hora. Si vos no solicitaste este cambio, ignorá este correo y tu contraseña actual permanecerá intacta y segura.</p>
    `;
    return this.getBaseHtmlTemplate('Recuperación de Contraseña - TicoHabitat', innerHtml);
  }
}
