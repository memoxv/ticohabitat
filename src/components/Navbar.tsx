'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import {
  Home,
  PlusCircle,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Heart,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar() {
  const { theme, toggleTheme, user, logout, favorites } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className={`sticky top-4 z-50 mx-auto max-w-5xl w-[92%] bg-card-bg/85 backdrop-blur-md border border-card-border/40 shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] transition-all duration-350 px-6 py-0.5 ${
      mobileMenuOpen ? 'rounded-[2rem]' : 'rounded-full'
    }`}>
      <div className="w-full">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
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
              href="/comprar"
              className="text-sm font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              Comprar
            </Link>
            <Link
              href="/alquilar"
              className="text-sm font-bold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              Alquilar
            </Link>
            
            {/* Favorites Icon with Badge */}
            <Link 
              href="/dashboard"
              className="relative p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-50 dark:hover:bg-stone-850/50 transition-colors"
              title="Mis Favoritos"
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
              href="/publicar"
              className="btn-primary py-2 px-4.5 text-xs inline-flex items-center gap-1.5 transition-all shadow-sm"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Publicar Anuncio</span>
            </Link>

            {/* Auth / Admin buttons */}
            {user ? (
              <div className="flex items-center gap-4 border-l border-stone-200 dark:border-stone-800 pl-5">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4 text-stone-450" />
                  <span>Mi Panel</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 text-xs font-black text-accent hover:underline pl-1"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Admin</span>
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-50 dark:hover:bg-stone-800/40 rounded-lg transition-colors cursor-pointer ml-1"
                  title="Cerrar Sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4 border-l border-stone-200 dark:border-stone-800 pl-5">
                <Link
                  href="/login"
                  className="text-sm font-bold text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white transition-colors"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="btn-secondary py-1.5 px-3.5 text-xs transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
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
              href="/comprar"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-stone-950"
            >
              Comprar Propiedades
            </Link>
            <Link
              href="/alquilar"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-stone-950"
            >
              Alquilar Propiedades
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-200 hover:text-stone-950"
            >
              <Heart className="h-4 w-4 text-red-500 fill-current" />
              <span>Mis Favoritos ({favorites.length})</span>
            </Link>
            <Link
              href="/publicar"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary py-2.5 w-full flex items-center justify-center gap-2 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Publicar propiedad</span>
            </Link>
            <hr className="border-card-border/50 my-1" />
            
            {user ? (
              <div className="flex flex-col gap-3">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-200"
                >
                  <User className="h-4 w-4 text-stone-400" />
                  <span>Mi Panel ({user.name})</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-bold text-accent"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Administración</span>
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
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary py-2.5 text-center flex items-center justify-center"
                >
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary py-2.5 text-center flex items-center justify-center"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
