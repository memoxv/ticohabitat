'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { resetPasswordAction } from '@/app/actions/passwordReset';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { KeyRound, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

function RestablecerContrasenaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast, language } = useApp();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showToast(language === 'en' ? 'The reset token is invalid or does not exist.' : 'El token de restablecimiento es inválido o no existe.', 'error');
      return;
    }
    if (password.length < 6) {
      showToast(language === 'en' ? 'The new password must be at least 6 characters long.' : 'La nueva contraseña debe tener al menos 6 caracteres.', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast(language === 'en' ? 'The passwords entered do not match.' : 'Las contraseñas ingresadas no coinciden.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordAction(token, password);
      setLoading(false);
      if (res.success) {
        setSuccess(true);
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      showToast(language === 'en' ? 'An unexpected error occurred while resetting your password.' : 'Ocurrió un error inesperado al restablecer tu contraseña.', 'error');
    }
  };

  if (!token) {
    return (
      <div className="max-w-md w-full px-6 text-center space-y-6">
        <div className="bg-white dark:bg-stone-900 border border-stone-250/70 dark:border-stone-800 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
          <h2 className="font-display text-xl font-extrabold text-stone-900 dark:text-white">
            {language === 'en' ? 'Invalid Link' : 'Enlace Inválido'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-semibold leading-relaxed">
            {language === 'en' ? 'Missing required security token. Make sure you click the complete link sent to your email.' : 'Falta el token de seguridad obligatorio. Asegúrate de hacer clic en el enlace completo enviado a tu correo.'}
          </p>
          <Link
            href={`/${language}/login`}
            className="btn-premium btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2 cursor-pointer shadow shadow-sm"
          >
            <span>{language === 'en' ? 'Back to Log In' : 'Volver a Iniciar Sesión'}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full px-6">
      
      {/* Back Link */}
      <Link
        href={`/${language}/login`}
        className="inline-flex items-center gap-1 text-xs font-bold text-stone-400 dark:text-stone-500 hover:text-primary transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{language === 'en' ? 'Back to Log In' : 'Volver a Iniciar Sesión'}</span>
      </Link>

      {/* Card */}
      <div className="bg-white dark:bg-stone-900 border border-stone-250/70 dark:border-stone-800 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
        
        {!success ? (
          <>
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/5 text-amber-550 border border-amber-500/10">
                <KeyRound className="h-5.5 w-5.5 text-amber-500" />
              </div>
              <h2 className="font-display text-xl font-extrabold text-stone-900 dark:text-white tracking-tight pt-2">
                {language === 'en' ? 'Reset Your Password' : 'Restablecé tu Contraseña'}
              </h2>
              <p className="text-xs text-stone-550 dark:text-stone-400 font-semibold leading-relaxed">
                {language === 'en' ? 'Enter your new security password to regain access to your account.' : 'Ingresá tu nueva contraseña de seguridad para recuperar el acceso a tu cuenta.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                  {language === 'en' ? 'New Password (min. 6 characters)' : 'Nueva Contraseña (mín. 6 caracteres)'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium py-2.5 pl-10 text-xs font-mono"
                  />
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-450" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                  {language === 'en' ? 'Confirm Password' : 'Confirmar Contraseña'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-premium py-2.5 pl-10 text-xs font-mono"
                  />
                  <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-450" />
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
                    <span>{language === 'en' ? 'Updating password...' : 'Actualizando contraseña...'}</span>
                  </>
                ) : (
                  <span>{language === 'en' ? 'Update Password' : 'Actualizar Contraseña'}</span>
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
                {language === 'en' ? 'Password Changed!' : '¡Contraseña Modificada!'}
              </h3>
              <p className="text-xs text-stone-550 dark:text-stone-400 leading-relaxed font-semibold">
                {language === 'en' ? 'Your password has been successfully reset. Click below to log in.' : 'Tu contraseña ha sido restablecida con éxito. Hacé clic abajo para iniciar sesión.'}
              </p>
            </div>

            <div className="w-full pt-4">
              <Link
                href={`/${language}/login`}
                className="btn-premium btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-2 shadow shadow-sm cursor-pointer"
              >
                <span>{language === 'en' ? 'Log In Now' : 'Iniciar Sesión Ahora'}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function RestablecerPage({ params }: { params: Promise<{ locale: string }> }) {
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
              {isEn ? 'Loading password reset...' : 'Cargando restablecimiento...'}
            </p>
          </div>
        </div>
      }>
        <RestablecerContrasenaContent />
      </Suspense>
    </div>
  );
}
