'use client';

import React, { useState } from 'react';
import { requestPasswordResetAction } from '@/app/actions/passwordReset';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { Mail, KeyRound, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function RecuperarContrasenaPage() {
  const { showToast, language } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [demoLink, setDemoLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast(language === 'en' ? 'Please enter a valid email address.' : 'Introduce una dirección de correo electrónico válida.', 'error');
      return;
    }

    setLoading(true);
    setDemoLink(null);
    try {
      const res = await requestPasswordResetAction(email);
      setLoading(false);
      if (res.success) {
        setSubmitted(true);
        setFeedbackMsg(res.message);
        showToast(res.message, 'success');
        if (res.resetLink) {
          setDemoLink(res.resetLink);
        }
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      showToast(language === 'en' ? 'An unexpected error occurred while processing the request.' : 'Ocurrió un error inesperado al procesar la solicitud.', 'error');
    }
  };

  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-24 flex items-center justify-center animate-fadeIn">
      <div className="max-w-md w-full px-6">
        
        {/* Back Link */}
        <Link
          href={`/${language}/login`}
          className="inline-flex items-center gap-1 text-xs font-bold text-stone-450 hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'en' ? 'Back to Log In' : 'Volver a Iniciar Sesión'}</span>
        </Link>

        {/* Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-250/70 dark:border-stone-800 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
          
          {!submitted ? (
            <>
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/5 text-amber-550 border border-amber-500/10">
                  <KeyRound className="h-5.5 w-5.5 text-amber-500" />
                </div>
                <h2 className="font-display text-xl font-extrabold text-stone-900 dark:text-white tracking-tight pt-2">
                  {language === 'en' ? 'Forgot your password?' : '¿Olvidaste tu contraseña?'}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold leading-relaxed">
                  {language === 'en' ? 'Enter your registered email and we will send you a secure link to reset it.' : 'Ingresá tu correo electrónico de registro y te enviaremos un enlace seguro para restablecerla.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                    {language === 'en' ? 'Email Address' : 'Correo Electrónico'}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder={language === 'en' ? 'example@email.com' : 'ejemplo@correo.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-premium py-2.5 pl-10 text-xs text-stone-800 dark:text-stone-100"
                    />
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-450" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-premium btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2 shadow shadow-sm active:scale-97 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{language === 'en' ? 'Sending link...' : 'Enviando enlace...'}</span>
                    </>
                  ) : (
                    <span>{language === 'en' ? 'Send Recovery Link' : 'Enviar Enlace de Recuperación'}</span>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-6 animate-fadeIn py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-350 border border-emerald-250/30 dark:border-emerald-900/30">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-500 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-xl font-extrabold text-stone-900 dark:text-white">
                  {language === 'en' ? 'Email Dispatched!' : '¡Correo Despachado!'}
                </h3>
                <p className="text-xs text-stone-550 dark:text-stone-405 leading-relaxed font-semibold">
                  {feedbackMsg}
                </p>
              </div>

              {demoLink && (
                <div className="border border-stone-250 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/60 rounded-xl p-4 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-500 tracking-wider uppercase">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    <span>{language === 'en' ? 'Demo Beta Link (Copy & paste):' : 'Enlace Demo Beta (Copia y pega):'}</span>
                  </div>
                  <div className="text-[10px] font-mono select-all break-all text-stone-700 dark:text-stone-300">
                    {demoLink}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-6 font-semibold uppercase tracking-wider">
                {language === 'en' ? "Didn't receive the email? Check your spam folder or try again." : '¿No recibiste el correo? Revisa tu carpeta de spam o intenta de nuevo.'}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
