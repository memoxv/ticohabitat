'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyEmailAction } from '@/app/actions/emailVerification';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { ShieldCheck, ShieldAlert, Loader2, Sparkles, Home, CheckCircle2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast, language } = useApp();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(
    language === 'en' 
      ? 'Verifying your email verification link...' 
      : 'Verificando tu enlace de correo electrónico...'
  );
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(
        language === 'en'
          ? 'The verification link does not have a valid token.'
          : 'El enlace de verificación no tiene un token válido.'
      );
      return;
    }

    if (hasProcessedRef.current) {
      return; // Skip duplicate executions entirely
    }

    const processVerification = async () => {
      try {
        hasProcessedRef.current = true; // Block subsequent executions immediately
        const res = await verifyEmailAction(token);
        if (res.success) {
          setStatus('success');
          // If the server action returned a message, we might translate or use it
          setMessage(res.message);
          showToast(res.message, 'success');
          
          // Sync client-side session cookie automatically
          await fetch('/api/auth/session');
        } else {
          setStatus('error');
          setMessage(res.message);
          showToast(res.message, 'error');
        }
      } catch (err) {
        console.error('Error verifying email:', err);
        setStatus('error');
        setMessage(
          language === 'en'
            ? 'An unexpected error occurred while processing the verification.'
            : 'Ocurrió un error inesperado al procesar la verificación.'
        );
      }
    };

    // Delay verification briefly to prevent double call in React 19 StrictMode and show a beautiful transition
    const timeout = setTimeout(() => {
      processVerification();
    }, 1200);

    return () => clearTimeout(timeout);
  }, [token, showToast, language]);

  return (
    <div className="max-w-md w-full px-6 text-center">
      <div className="bg-white dark:bg-stone-900 border border-stone-250/70 dark:border-stone-800 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6 flex flex-col items-center">
        
        {/* Visual Badge State */}
        {status === 'loading' && (
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-stone-200 dark:border-stone-850 animate-ping opacity-30" />
            <div className="h-14 w-14 rounded-full bg-stone-50 dark:bg-stone-950 flex items-center justify-center border border-stone-200/40 dark:border-stone-800">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-30" />
            <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center border border-emerald-250/30 dark:border-emerald-900/30">
              <ShieldCheck className="h-7 w-7 text-emerald-600 dark:text-emerald-500" />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="relative flex items-center justify-center h-16 w-16">
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping opacity-30" />
            <div className="h-14 w-14 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center border border-red-250/30 dark:border-red-900/30">
              <ShieldAlert className="h-7 w-7 text-red-655 dark:text-red-550" />
            </div>
          </div>
        )}

        {/* Text Details */}
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            {status === 'loading' && (language === 'en' ? 'Validating Link' : 'Validando Enlace')}
            {status === 'success' && (language === 'en' ? 'Email Verified!' : '¡Correo Verificado!')}
            {status === 'error' && (language === 'en' ? 'Invalid Link' : 'Enlace Inválido')}
          </h2>
          <p className="text-xs text-stone-550 dark:text-stone-405 font-semibold leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Button */}
        {status !== 'loading' && (
          <div className="w-full pt-4">
            <Link
              href={status === 'success' ? `/${language}/dashboard` : `/${language}`}
              className="btn-premium btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2 shadow shadow-sm active:scale-97 cursor-pointer"
            >
              {status === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{language === 'en' ? 'Go to My Dashboard' : 'Ir a Mi Panel de Control'}</span>
                </>
              ) : (
                <>
                  <Home className="h-4 w-4" />
                  <span>{language === 'en' ? 'Back to Home' : 'Volver al Inicio'}</span>
                </>
              )}
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default async function VerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' || locale === 'es' ? locale : 'es';
  const isEn = lang === 'en';

  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-24 flex items-center justify-center animate-fadeIn">
      <Suspense fallback={
        <div className="max-w-md w-full px-6 text-center">
          <div className="bg-white dark:bg-stone-900 border border-stone-250/70 dark:border-stone-800 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6 flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-xs text-stone-550 font-semibold">
              {isEn ? 'Loading verification...' : 'Cargando verificación...'}
            </p>
          </div>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
