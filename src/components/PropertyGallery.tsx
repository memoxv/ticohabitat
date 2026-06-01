'use client';

import React, { useState } from 'react';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, Maximize2, X, Sparkles } from 'lucide-react';

interface PropertyGalleryProps {
  images: string[];
  title: string;
  type: string;
  featured: boolean;
  verified: boolean;
  contactPhone?: string;
}

export default function PropertyGallery({
  images,
  title,
  type,
  featured,
  verified,
  contactPhone,
}: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Swipe gesture tracking state
  const touchStart = React.useRef(0);
  const touchEnd = React.useRef(0);

  const listImages = images.length > 0 
    ? images 
    : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80'];

  const typeLabel = type === 'buy' ? 'Venta' : 'Alquiler';

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? listImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === listImages.length - 1 ? 0 : prev + 1));
  };

  // Mobile swipe navigation gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const diff = touchStart.current - touchEnd.current;
    
    // Swipe sensitivity threshold: 50px
    if (diff > 50) {
      handleNext(); // Swiped left, show next
    }
    if (diff < -50) {
      handlePrev(); // Swiped right, show prev
    }

    touchStart.current = 0;
    touchEnd.current = 0;
  };

  return (
    <div className="space-y-4">
      {/* 1. VISOR PRINCIPAL */}
      <div
        className="relative overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-850 shadow-sm aspect-[16/10] max-h-[500px] w-full group select-none cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => setLightboxOpen(true)}
      >
        {/* Active main photo with smooth fade-scale animation key */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={activeIndex}
          src={listImages[activeIndex]}
          alt={`${title} - Foto ${activeIndex + 1}`}
          className="h-full w-full object-cover animate-fade-scale"
        />

        {/* Expand zoom icon overlay on hover */}
        <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-card-bg/90 p-3 rounded-full shadow-lg flex items-center justify-center">
            <Maximize2 className="h-5 w-5 text-stone-800 dark:text-stone-200" />
          </div>
        </div>

        {/* Primary badges absolute overlay */}
        <div className="absolute top-4 left-4 z-15 flex flex-wrap gap-2 pointer-events-none">
          <span className={`rounded px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-sm ${
            type === 'buy' ? 'bg-stone-950 dark:bg-stone-100 dark:text-stone-900' : 'bg-primary'
          }`}>
            {typeLabel}
          </span>
          
          {featured && (
            <span className="flex items-center gap-1 rounded bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-stone-950 shadow-sm border border-amber-300 animate-pulse">
              <Sparkles className="h-3.5 w-3.5 fill-stone-950 text-stone-950 shrink-0" />
              <span>Destacado</span>
            </span>
          )}
          {verified && (
            <div className="relative group/tooltip">
              <span 
                className="flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm cursor-help relative overflow-visible"
              >
                <span className="relative flex h-1.5 w-1.5 shrink-0 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verificado</span>
              </span>
              
              {/* Trust Tooltip content */}
              <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-stone-950 text-white rounded-xl border border-stone-800 shadow-2xl opacity-0 -translate-y-1 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all duration-200 z-50 text-[10px] leading-relaxed select-text normal-case tracking-normal">
                <div className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>Anunciante Verificado por Correo</span>
                </div>
                <p className="text-stone-300">
                  El anunciante ha validado su identidad y dirección de correo electrónico de forma segura en TicoHabitat. Contacto directo y confiable.
                </p>
                <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-stone-400 font-mono flex items-center justify-between">
                  <span>SEGURIDAD CORREO</span>
                  <span className="text-emerald-450 font-black">100% CONFIABLE</span>
                </div>
                {contactPhone && (
                  <div className="mt-2.5 pt-2 border-t border-white/5 text-[8.5px] text-stone-400 leading-relaxed font-sans">
                    ¿Este número de teléfono le pertenece pero está siendo utilizado por alguien más? <a href={`https://wa.me/50660677055?text=Mi%20n%C3%BAmero%20${encodeURIComponent(contactPhone)}%20est%C3%A1%20registrado%20en%20TicoHabitat%20por%20alguien%20que%20no%20es%20el%20due%C3%B1o`} target="_blank" rel="noopener noreferrer" className="text-emerald-450 font-bold hover:underline">Reportarlo aquí por WhatsApp ➔</a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Photos counter indicator overlay */}
        <div className="absolute bottom-4 right-4 z-15 bg-stone-950/70 text-white font-mono text-[10px] font-bold px-3 py-1.5 rounded shadow">
          {activeIndex + 1} de {listImages.length}
        </div>

        {/* Navigation arrows (visible on desktop hover) */}
        {listImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-card-bg/90 text-stone-800 dark:text-stone-200 shadow hover:bg-card-bg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              title="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 flex items-center justify-center rounded-full bg-card-bg/90 text-stone-800 dark:text-stone-200 shadow hover:bg-card-bg cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              title="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* 2. MINIATURAS HORIZONTALES (Desktop / Tablet) */}
      {listImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {listImages.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative flex-shrink-0 aspect-[4/3] w-20 sm:w-24 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                idx === activeIndex
                  ? 'border-primary scale-[1.02]'
                  : 'border-stone-200 dark:border-stone-800 opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`${title} Thumb ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. LIGHTBOX FULLSCREEN MODAL - Frosted Glass & Smooth transitions */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] bg-stone-950/90 backdrop-blur-xl flex flex-col items-center justify-center animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Header Panel */}
          <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-stone-950/80 to-transparent flex items-center justify-between text-white z-21">
            <span className="text-xs font-bold tracking-tight line-clamp-1 max-w-[80%] pr-4">
              {title}
            </span>
            <span className="text-xs font-mono font-bold pr-14">
              {activeIndex + 1} / {listImages.length}
            </span>
            <button
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 dark:bg-stone-900/40 border border-white/10 backdrop-blur-md hover:bg-white/20 hover:scale-105 hover:rotate-90 transition-all duration-300 text-white cursor-pointer absolute right-6"
              title="Cerrar visor"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Large visoring image area */}
          <div
            className="relative max-w-5xl w-full max-h-[80vh] px-4 flex items-center justify-center animate-fade-scale"
            onClick={(e) => e.stopPropagation()}
            key={activeIndex}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={listImages[activeIndex]}
              alt={`${title} - Ampliada ${activeIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />

            {/* Lightbox arrows */}
            {listImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-6 h-12 w-12 flex items-center justify-center rounded-full bg-stone-900/70 hover:bg-stone-900 text-white shadow-md cursor-pointer transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <button
                  onClick={handleNext}
                  className="absolute right-6 h-12 w-12 flex items-center justify-center rounded-full bg-stone-900/70 hover:bg-stone-900 text-white shadow-md cursor-pointer transition-colors"
                  title="Siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
