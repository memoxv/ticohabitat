'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { getTranslations } from '@/lib/translations';
import {
  PlusCircle,
  User,
  LogOut,
  Menu,
  X,
  Heart,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar() {
  const { language, setLanguage, user, logout, favorites } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPendingLanguage, setIsPendingLanguage] = useState(false);
  const targetLangRef = React.useRef<'es' | 'en' | null>(null);
  const router = useRouter();
  const t = getTranslations(language);

  const handleLanguageToggle = () => {
    if (isPendingLanguage) return;
    
    const nextLang = language === 'es' ? 'en' : 'es';
    setIsPendingLanguage(true);
    targetLangRef.current = nextLang;
    
    const pathname = window.location.pathname;
    const search = window.location.search;
    
    const segments = pathname.split('/');
    if (segments[1] === 'es' || segments[1] === 'en') {
      segments[1] = nextLang;
    } else {
      segments.splice(1, 0, nextLang);
    }
    const nextPathname = segments.join('/');

    // Wait 1 second before pushing to Next.js router to ensure a clean visual loading transition
    setTimeout(() => {
      setMobileMenuOpen(false);
      router.push(`${nextPathname}${search}`);
    }, 1000);
  };

  // Sync / dismiss loading overlay only when the actual context language has updated to match the target language
  useEffect(() => {
    if (isPendingLanguage && language === targetLangRef.current) {
      setIsPendingLanguage(false);
      targetLangRef.current = null;
    }
  }, [language, isPendingLanguage]);

  return (
    <>
      <nav className={`sticky top-4 z-50 mx-auto max-w-5xl w-[92%] bg-card-bg/85 backdrop-blur-md border border-card-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-[background-color,border-color,shadow] duration-350 px-6 py-0.5 ${
        mobileMenuOpen ? 'rounded-[2rem]' : 'rounded-full'
      }`}>
      <div className="w-full">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={`/${language}`} className="flex items-center gap-2.5 group">
              <img
                src="/logo-icon.png"
                alt="TicoHabitat Logo"
                className="h-8 w-8 object-contain group-hover:scale-105 transition-transform duration-200"
              />
              <span className="font-display text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">
                Tico<span className="text-primary">Habitat</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-7">
            <Link
              href={`/${language}/comprar`}
              className="text-sm font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              {t.common.buy}
            </Link>
            <Link
              href={`/${language}/alquilar`}
              className="text-sm font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              {t.common.rent}
            </Link>
            
            {/* Favorites Icon with Badge */}
            <Link 
              href={`/${language}/dashboard`}
              className="relative p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-50 dark:hover:bg-stone-850/50 transition-colors"
              title={t.navbar.favorites}
            >
              <Heart className={`h-4.5 w-4.5 ${favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {favorites.length > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-sm ring-2 ring-white dark:ring-stone-900">
                  {favorites.length}
                </span>
              )}
            </Link>


            {/* CTA: Publish - Stood out beautifully */}
            <Link
              href={`/${language}/publicar`}
              className="btn-primary py-2 px-4.5 text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{t.common.publish}</span>
            </Link>

            {/* Language Switcher */}
            <button
              onClick={handleLanguageToggle}
              disabled={isPendingLanguage}
              className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider bg-warm-stone hover:bg-stone-200/40 dark:hover:bg-stone-800/20 px-3 py-1.5 rounded-full border border-card-border transition-all cursor-pointer shadow-sm ml-1 disabled:opacity-80 disabled:cursor-not-allowed"
              title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <span className={language === 'es' ? 'text-primary font-black' : 'text-stone-500 dark:text-stone-400 opacity-50 hover:opacity-100 transition-opacity'}>ES</span>
              <span className="text-stone-300 dark:text-stone-800/40">|</span>
              <span className={language === 'en' ? 'text-primary font-black' : 'text-stone-500 dark:text-stone-400 opacity-50 hover:opacity-100 transition-opacity'}>EN</span>
            </button>

            {/* Auth / Admin buttons */}
            {user ? (
              <div className="flex items-center gap-4 border-l border-stone-200 dark:border-stone-800 pl-5">
                <Link
                  href={`/${language}/dashboard`}
                  className="flex items-center gap-1.5 text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4 text-stone-450" />
                  <span>{t.common.dashboard}</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href={`/${language}/admin`}
                    className="flex items-center gap-1 text-xs font-black text-accent hover:underline pl-1"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{t.common.admin}</span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-50 dark:hover:bg-stone-800/40 rounded-lg transition-colors cursor-pointer ml-1"
                  title={t.common.logout}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-stone-200 dark:border-stone-800 pl-5">
                <Link
                  href={`/${language}/login`}
                  className="text-sm font-bold text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white transition-colors"
                >
                  {t.common.login}
                </Link>
                <Link
                  href={`/${language}/registro`}
                  className="btn-secondary py-1.5 px-3.5 text-xs transition-colors"
                >
                  {t.common.register}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            {/* Mobile Language Switcher (Quick Toggle Icon) */}
            <button
              onClick={handleLanguageToggle}
              disabled={isPendingLanguage}
              className="text-[10px] font-black bg-warm-stone border border-card-border px-2.5 py-1 rounded-full disabled:opacity-80 disabled:cursor-not-allowed flex items-center gap-1 text-stone-700 dark:text-stone-200 hover:bg-stone-200/40 dark:hover:bg-stone-800/20 transition-all"
              title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <span>{language.toUpperCase()}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-850 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-card-bg border-t border-card-border/30 pb-5 pt-3 px-1 mt-1 animate-fadeIn">
          <div className="flex flex-col gap-4">
            <Link
              href={`/${language}/comprar`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-stone-950"
            >
              {t.common.buy}
            </Link>
            <Link
              href={`/${language}/alquilar`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-stone-950"
            >
              {t.common.rent}
            </Link>
            <Link
              href={`/${language}/dashboard`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-stone-950"
            >
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>{t.navbar.favorites} ({favorites.length})</span>
            </Link>
            <Link
              href={`/${language}/publicar`}
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary py-2.5 w-full flex items-center justify-center gap-2 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{t.common.publish}</span>
            </Link>
            
            <div className="flex items-center justify-between py-2 px-1 border-t border-card-border/30 mt-1">
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
                {language === 'es' ? 'Idioma de la plataforma' : 'Platform language'}
              </span>
              <button
                onClick={handleLanguageToggle}
                disabled={isPendingLanguage}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-warm-stone hover:bg-stone-200/40 dark:hover:bg-stone-800/20 px-3.5 py-1.5 rounded-full border border-card-border transition-all cursor-pointer shadow-sm disabled:opacity-80 disabled:cursor-not-allowed"
              >
                <span className={language === 'es' ? 'text-primary font-black' : 'text-stone-500 dark:text-stone-400 opacity-50'}>ES</span>
                <span className="text-stone-300 dark:text-stone-800/40">|</span>
                <span className={language === 'en' ? 'text-primary font-black' : 'text-stone-500 dark:text-stone-400 opacity-50'}>EN</span>
              </button>
            </div>

            <hr className="border-card-border/50 my-1" />
            
            {user ? (
              <div className="flex flex-col gap-3">
                <Link
                  href={`/${language}/dashboard`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-200"
                >
                  <User className="h-4 w-4 text-stone-450" />
                  <span>{t.common.dashboard} ({user.name})</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href={`/${language}/admin`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-bold text-accent"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>{t.navbar.adminPanel}</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-sm font-bold text-red-500 text-left cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.common.logout}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href={`/${language}/login`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary py-2.5 text-center flex items-center justify-center"
                >
                  {t.common.login}
                </Link>
                <Link
                  href={`/${language}/registro`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary py-2.5 text-center flex items-center justify-center"
                >
                  {t.common.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
      </nav>

      {/* Premium Full-Screen Loading Overlay to block interaction & show loader */}
      {isPendingLanguage && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex flex-col items-center justify-center bg-stone-900/60 dark:bg-stone-950/75 backdrop-blur-[3px] pointer-events-auto select-none transition-all duration-300">
          <div className="flex flex-col items-center gap-4.5 p-7 rounded-2xl bg-white dark:bg-stone-900 border border-stone-250/20 dark:border-stone-800/60 shadow-xl max-w-xs w-[85%] text-center animate-scaleIn">
            <div className="relative flex items-center justify-center">
              {/* Spinner animation */}
              <div className="h-10 w-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <img
                src="/logo-icon.png"
                alt="Logo"
                className="absolute h-4.5 w-4.5 object-contain"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-stone-850 dark:text-stone-100">
                {language === 'es' ? 'Cargando traducción' : 'Loading translation'}
              </p>
              <p className="text-[10px] font-bold text-stone-450 dark:text-stone-550">
                {language === 'es' ? 'Por favor espere un momento...' : 'Please wait a moment...'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
