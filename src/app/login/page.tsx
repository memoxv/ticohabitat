'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';
import { KeyRound, Mail, LogIn, Award } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Por favor introduce tu correo electrónico.', 'error');
      return;
    }

    setSubmitting(true);
    
    const sessionUser = await login(email, 'USER', undefined, undefined, password);
    setSubmitting(false);

    if (sessionUser) {
      if (sessionUser.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-28 lg:py-36 flex items-center justify-center animate-fadeIn">
      <div className="max-w-md w-full px-6">
        
        {/* Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <Link href="/">
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
              Ingresá a tu espacio
            </h2>
            <p className="text-xs text-stone-450 dark:text-stone-500 font-semibold leading-relaxed">
              Gestioná tus anuncios y favoritos con total tranquilidad.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Correo Electrónico</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-primary text-stone-800 dark:text-stone-100"
                />
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Contraseña</label>
                <Link
                  href="/recuperar-contrasena"
                  className="text-[10px] text-stone-400 dark:text-stone-500 hover:text-primary transition-colors font-bold"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950 px-4 py-2.5 pl-10 text-xs focus:outline-none focus:border-primary text-stone-800 dark:text-stone-100"
                />
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-stone-950 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-250 py-3 text-xs font-bold text-white dark:text-stone-900 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{submitting ? 'Ingresando...' : 'Iniciar Sesión'}</span>
            </button>
          </form>

          <p className="text-center text-xs text-stone-400 dark:text-stone-500 mt-6 font-medium">
            ¿No tiene una cuenta? <Link href="/registro" className="text-primary hover:underline font-bold">Regístrese gratis</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
