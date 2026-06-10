'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { User, Mail, KeyRound, Phone, UserPlus } from 'lucide-react';
import { isPhoneAlreadyUsedAction } from '@/app/actions/otp';
import { getTranslations } from '@/lib/translations';

export default function RegistroPage() {
  const router = useRouter();
  const { login, showToast, verifyPhoneInSession, language } = useApp();
  const t = getTranslations(language);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [phoneInUseError, setPhoneInUseError] = useState(false);
  const [duplicatePhone, setDuplicatePhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast(language === 'en' ? 'Please complete all required fields.' : 'Por favor completa todos los campos requeridos.', 'error');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 8) {
      showToast(language === 'en' ? 'Please enter a valid 8-digit mobile phone number.' : 'Por favor ingresa un número de teléfono celular válido de 8 dígitos.', 'error');
      return;
    }

    setSubmitting(true);
    setPhoneInUseError(false);

    // Check if phone is already in use
    const isUsed = await isPhoneAlreadyUsedAction(cleanPhone);
    if (isUsed.exists) {
      setPhoneInUseError(true);
      setDuplicatePhone(cleanPhone);
      showToast(language === 'en' ? 'The phone number has already been registered on another account.' : 'El número de teléfono ya ha sido registrado en otra cuenta.', 'error');
      setSubmitting(false);
      return;
    }
    
    // Simulate user creation and automatic login
    const sessionUser = await login(email, 'USER', cleanPhone, name, password, true);
    
    // Pre-verify in session context to keep development extremely frictionless!
    verifyPhoneInSession(cleanPhone);
    
    // Trigger automated email verification dispatch!
    if (sessionUser) {
      try {
        const { sendEmailVerification } = await import('@/app/actions/emailVerification');
        await sendEmailVerification();
      } catch (err) {
        console.error('Failed to trigger signup verification email:', err);
      }
    }
    
    setSubmitting(false);

    if (sessionUser) {
      showToast(language === 'en' ? 'Account created. We sent a verification link to your email.' : 'Cuenta creada. Enviamos un enlace de validación a tu correo.', 'success');
      router.push(`/${language}/dashboard`);
    }
  };


  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-24 lg:py-32 flex items-center justify-center animate-fadeIn">
      <div className="max-w-md w-full px-6">
        
        {/* Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <Link href={`/${language}`}>
            <img
              src="/logo-vertical.png"
              alt="TicoHabitat Logo"
              className="h-32 w-auto object-contain hover:scale-102 transition-transform duration-300"
            />
          </Link>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-stone-900 border border-stone-250/70 dark:border-stone-800 rounded-2xl p-8 sm:p-10 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display text-xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              {language === 'en' ? 'Create your advertiser account' : 'Creá tu cuenta de anunciante'}
            </h2>
            <p className="text-xs text-stone-450 dark:text-stone-500 font-semibold leading-relaxed">
              {language === 'en' ? "Join the country's most trusted real estate community." : 'Unite a la comunidad inmobiliaria más confiable del país.'}
            </p>
          </div>

          {/* Elegant Alert Banner for duplicate phone */}
          {phoneInUseError && (
            <div className="border border-red-500/20 bg-red-500/5 text-stone-800 dark:text-stone-200 rounded-xl p-5 text-xs space-y-3.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-red-650 dark:text-red-400 tracking-wide uppercase text-[10px]">
                <Phone className="h-4 w-4 text-red-500 shrink-0" />
                <span>{language === 'en' ? 'Phone number already registered' : 'Número telefónico ya registrado'}</span>
              </div>
              <p className="text-stone-650 dark:text-stone-400 leading-relaxed font-semibold">
                {language === 'en' ? (
                  <>
                    The phone number <strong className="font-mono text-stone-900 dark:text-white">+{duplicatePhone}</strong> has already been used on another TicoHabitat account.
                  </>
                ) : (
                  <>
                    El número de teléfono <strong className="font-mono text-stone-900 dark:text-white">+{duplicatePhone}</strong> ya ha sido utilizado en otra cuenta de TicoHabitat.
                  </>
                )}
              </p>
              <p className="text-stone-500 dark:text-stone-500 font-bold text-[10.5px]">
                {language === 'en'
                  ? 'If you believe this is an error and you are the legitimate owner of the number, contact us immediately for assistance:'
                  : 'Si consideras que esto es un error y eres el propietario legítimo del número, contáctanos de inmediato para asistirte:'}
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <a
                  href={language === 'en'
                    ? `mailto:lleguele.grecia@gmail.com?subject=TicoHabitat%20-%20Phone%20Number%20Conflict&body=Hello%20TicoHabitat%20Administrator%2C%0A%0AI%20am%20trying%20to%20register%20but%20the%2520phone%2520number%2520${duplicatePhone}%20already%20appears%20registered.%20My%20name%20is%3A%20${encodeURIComponent(name || '[My Name]')}.%20I%2520request%2520assistance%2520to%2520resolve%2520this%2520conflict.%0A%0AThank%2520you.`
                    : `mailto:lleguele.grecia@gmail.com?subject=TicoHabitat%20-%20Conflicto%20de%20N%C3%BAmero%20Telef%C3%B3nico&body=Hola%20Administrador%20de%20TicoHabitat%2C%0A%0AEstoy%20intentando%20registrarme%20pero%20el%2520número%2520de%2520teléfono%2520${duplicatePhone}%20ya%20aparece%20registrado.%20Mi%20nombre%20es%3A%20${encodeURIComponent(name || '[Mi Nombre]')}.%20Solicito%20asistencia%20para%20resolver%20este%20conflicto.%0A%0AGracias.`}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-950/60 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 transition-all cursor-pointer shadow-sm text-center"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>{language === 'en' ? 'Send Email to Support' : 'Enviar Correo a Soporte'}</span>
                </a>
                <a
                  href={language === 'en'
                    ? `https://wa.me/50660677055?text=Hello!%20I%20am%20trying%20to%20register%20on%20TicoHabitat%20with%20the%20number%20${duplicatePhone}%20but%20it%20says%20it%20is%20already%2520in%2520use.%20Could%20you%20help%20me?%20My%20name%252520is%252520${encodeURIComponent(name || '[My Name]')}.`
                    : `https://wa.me/50660677055?text=Hola!%20Estoy%20intentando%20registrarme%20en%20TicoHabitat%20con%20el%20número%20${duplicatePhone}%20pero%20indica%20que%2520ya%2520está%2520en%2520uso.%20¿Me%20podrían%20ayudar?%20Mi%2520nombre%252520es%252520${encodeURIComponent(name || '[Mi Nombre]')}.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-550 dark:bg-emerald-700 dark:hover:bg-emerald-650 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm text-center"
                >
                  <span className="shrink-0 font-bold">💬</span>
                  <span>{language === 'en' ? 'Send WhatsApp to Support' : 'Enviar WhatsApp a Soporte'}</span>
                </a>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{t.auth.nameLabel}</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'en' ? 'John Doe' : 'Carlos Vargas'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-primary text-stone-800 dark:text-stone-100"
                />
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{t.auth.emailLabel}</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder={language === 'en' ? 'example@email.com' : 'ejemplo@correo.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-primary text-stone-800 dark:text-stone-100"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{language === 'en' ? 'Mobile Phone (Required)' : 'Teléfono Móvil (Obligatorio)'}</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={language === 'en' ? 'E.g. 88888888' : 'Ej: 88888888'}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    setPhoneInUseError(false);
                  }}

                  className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-primary text-stone-800 dark:text-stone-100 font-mono"
                />
                <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">{t.auth.passwordLabel}</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-primary text-stone-800 dark:text-stone-100"
                />
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-450" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-stone-950 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-250 py-3 text-xs font-bold text-white dark:text-stone-900 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <UserPlus className="h-4.5 w-4.5" />
              <span>
                {submitting 
                  ? (language === 'en' ? 'Creating Account...' : 'Creando Cuenta...') 
                  : (language === 'en' ? 'Register Account' : 'Registrar Cuenta')}
              </span>
            </button>
          </form>

          <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-6 font-medium">
            {language === 'en' ? (
              <>
                Already have an account? <Link href={`/${language}/login`} className="text-primary hover:underline font-bold">Log in here</Link>
              </>
            ) : (
              <>
                ¿Ya tiene una cuenta? <Link href={`/${language}/login`} className="text-primary hover:underline font-bold">Inicie sesión aquí</Link>
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  );
}
