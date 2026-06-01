import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-stone-950 text-stone-400 py-16 border-t border-stone-850">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 text-white">
              <img
                src="/logo-icon.png"
                alt="TicoHabitat Logo"
                className="h-9 w-9 object-contain"
              />
              <span className="font-display text-lg font-bold tracking-tight">
                Tico<span className="text-primary">Habitat</span>
              </span>
            </Link>
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              La plataforma de propiedades de Costa Rica con validación móvil obligatoria y control real contra anuncios duplicados. Encuentra tu espacio con total seriedad.
            </p>
            <div className="pt-4">
              <a
                href="https://soutlabs.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-wider bg-stone-900/40 hover:bg-stone-900/80 border border-stone-850 hover:border-emerald-500/40 text-stone-400 hover:text-white px-4 py-2 rounded-xl transition-all duration-300 group cursor-pointer shadow-sm shadow-black/10"
              >
                <div className="h-5 w-5 bg-stone-950 rounded-lg flex items-center justify-center border border-stone-800 group-hover:border-emerald-500/30 transition-colors">
                  <img
                    src="/soutlabs-logo.svg"
                    alt="SoutLabs Logo"
                    className="h-3 w-3 object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-[9px] font-bold text-stone-500 tracking-wider lowercase">desarrollado por</span>
                  <span className="font-display font-black text-stone-200 group-hover:text-emerald-450 transition-colors tracking-wide normal-case">
                    Sout<span className="text-emerald-450 group-hover:text-emerald-400">Labs</span>
                  </span>
                </div>
                <span className="text-stone-600 group-hover:text-stone-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1 text-xs">→</span>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-display text-xs font-bold text-stone-300 tracking-widest uppercase mb-4">Provincias Clave</h3>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/comprar/san-jose" className="hover:text-white transition-colors">Propiedades en San José</Link>
              </li>
              <li>
                <Link href="/alquilar/alajuela" className="hover:text-white transition-colors">Alquileres en Alajuela</Link>
              </li>
              <li>
                <Link href="/comprar/guanacaste" className="hover:text-white transition-colors">Playas en Guanacaste</Link>
              </li>
              <li>
                <Link href="/alquilar/heredia" className="hover:text-white transition-colors">Apartamentos en Heredia</Link>
              </li>
            </ul>
          </div>

          {/* Legal / Contact */}
          <div>
            <h3 className="font-display text-xs font-bold text-stone-300 tracking-widest uppercase mb-4">Plataforma</h3>
            <ul className="space-y-2.5 text-xs font-medium">
              <li>
                <Link href="/publicar" className="hover:text-white transition-colors">Publicar una propiedad</Link>
              </li>
              <li>
                <a href="https://wa.me/50660677055" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Soporte WhatsApp</a>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">Preguntas Frecuentes</Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
              </li>
            </ul>
          </div>
        </div>
        
        <hr className="border-stone-900 my-10" />
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-stone-500">
          <p>© {new Date().getFullYear()} TicoHabitat. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1.5">
            <span>Bienes Raíces de Costa Rica</span>
            <span className="text-stone-700">|</span>
            <span>Estilo de vida natural</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
