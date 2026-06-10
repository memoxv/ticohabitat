'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { createFeaturedTransactionAction, activateFreeFeaturedAction } from '@/app/actions/monetization';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Zap,
  CheckCircle,
  Copy,
  Calendar,
  ChevronRight,
  TrendingUp,
  FileImage,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface DestacarClientProps {
  property: {
    id: string;
    title: string;
    price: number;
    currency: string;
    province: string;
    imageUrl: string | null;
    featured: boolean;
    featuredExpiresAt: string | null;
  };
  isPending: boolean;
  planType: string;
  featuredCount: number;
  maxFeatured: number;
  hasFreeSlot: boolean;
}

export default function DestacarClient({
  property,
  isPending,
  planType,
  featuredCount,
  maxFeatured,
  hasFreeSlot,
}: DestacarClientProps) {
  const { showToast, language } = useApp();
  const router = useRouter();
  const [duration, setDuration] = useState<7 | 15 | 30>(7);
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activatingFree, setActivatingFree] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successSubmitted, setSuccessSubmitted] = useState(false);


  const priceMap = {
    7: 5000,
    15: 9000,
    30: 15000,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('+50660677055');
    setCopied(true);
    showToast('Número SINPE Móvil copiado al portapapeles.', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  // Compress image helper using canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor suba únicamente archivos de imagen.', 'error');
      return;
    }

    setCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Optimized base64 image representation
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setReceiptBase64(dataUrl);
        setReceiptName(file.name);
        setCompressing(false);
      };
    };
    reader.onerror = () => {
      showToast('Error al procesar la imagen.', 'error');
      setCompressing(false);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptBase64) {
      showToast('Por favor cargue la captura de su comprobante SINPE.', 'error');
      return;
    }

    setSubmitting(true);
    const res = await createFeaturedTransactionAction({
      propertyId: property.id,
      durationDays: duration,
      amount: priceMap[duration],
      receiptBase64,
    });
    setSubmitting(false);

    if (res.success) {
      showToast(res.message, 'success');
      setSuccessSubmitted(true);
      router.refresh();
    } else {
      showToast(res.message || 'Error al procesar el comprobante.', 'error');
    }
  };

  const handleActivateFree = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivatingFree(true);
    const res = await activateFreeFeaturedAction(property.id, duration);
    setActivatingFree(false);

    if (res.success) {
      showToast(res.message, 'success');
      setSuccessSubmitted(true);
      router.refresh();
    } else {
      showToast(res.message || 'Error al procesar el destaque de cortesía.', 'error');
    }
  };


  if (successSubmitted || isPending) {
    return (
      <div className="rounded-2xl border border-card-border bg-card-bg p-8 text-center max-w-xl mx-auto shadow-md">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 animate-bounce" />
        <h3 className="font-display font-black text-xl text-stone-900 dark:text-white mb-2 uppercase tracking-wide">
          ¡Comprobante SINPE en Revisión!
        </h3>
        <p className="text-xs text-stone-500 leading-relaxed mb-6">
          Ya hemos registrado la solicitud de destaque para tu propiedad: <strong>"{property.title}"</strong>. Un administrador revisará la transferencia y activará el distintivo tridimensional en unos minutos.
        </p>

        <div className="bg-background border border-card-border rounded-xl p-4 mb-8 text-left space-y-2">
          <div className="text-[10px] uppercase font-bold text-stone-400">Propiedad</div>
          <div className="text-xs font-bold text-stone-800 dark:text-white line-clamp-1">{property.title}</div>
          <div className="text-[10px] uppercase font-bold text-stone-400 mt-2">Destaque Solicitado</div>
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-450">{duration} Días (₡{priceMap[duration].toLocaleString()})</div>
        </div>

        <Link
          href={`/${language}/dashboard`}
          className="btn-primary py-3 px-6 text-xs inline-block font-bold uppercase tracking-wider shadow-sm cursor-pointer"
        >
          Volver a Mi Panel
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Listing Card Preview Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-2xl border border-card-border bg-card-bg overflow-hidden shadow-sm">
          <div className="text-[10px] font-black uppercase tracking-wider text-stone-400 px-6 pt-5 block">
            Propiedad a Destacar
          </div>
          
          <div className="p-6 space-y-4">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-stone-100 dark:bg-stone-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={property.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'}
                alt={property.title}
                className="h-full w-full object-cover"
              />
              
              {/* Real tridimensional visual representation badge */}
              <span className="absolute top-3 right-3 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md bg-gradient-to-r from-amber-500 to-yellow-500 animate-pulse border border-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                <span>Destacado</span>
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="font-display font-bold text-sm text-stone-850 dark:text-stone-100 line-clamp-2">
                {property.title}
              </h4>
              <p className="text-[10px] font-bold text-stone-400 uppercase">{property.province}</p>
            </div>

            <div className="text-xl font-black text-emerald-700 dark:text-emerald-450 font-display">
              {property.currency === 'CRC' ? '₡' : '$'}{property.price.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Benefits Box */}
        <div className="rounded-2xl border border-card-border bg-card-bg p-6 space-y-4 shadow-sm">
          <h4 className="font-bold text-[10px] uppercase text-stone-400 dark:text-stone-550 tracking-wider">
            ¿Qué ganas al destacar tu anuncio?
          </h4>
          
          <ul className="space-y-3.5">
            <li className="flex items-start gap-2 text-xs">
              <TrendingUp className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-800 dark:text-stone-200">Visibilidad 5x Mayor</strong>
                <span className="text-stone-500 dark:text-stone-400 text-[11px]">Tu anuncio aparece en los primeros lugares de las búsquedas de tu provincia.</span>
              </div>
            </li>
            <li className="flex items-start gap-2 text-xs">
              <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <strong className="block text-stone-800 dark:text-stone-200">Sello Dorado Tridimensional</strong>
                <span className="text-stone-500 dark:text-stone-400 text-[11px]">Atrae clics inmediatos con el badge dorado animado en catálogo y home.</span>
              </div>
            </li>
            <li className="flex items-start gap-2 text-xs">
              <Zap className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-800 dark:text-stone-200">Presencia en Portada (Tendencia)</strong>
                <span className="text-stone-500 dark:text-stone-400 text-[11px]">Rotación exclusiva en el módulo de propiedades destacadas de la página principal.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Destaque Duration & Checkout Column */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Step 1: Duration Selector */}
        <div className="rounded-2xl border border-card-border bg-card-bg p-6 shadow-sm space-y-4">
          <h3 className="font-display font-black text-sm uppercase text-stone-700 dark:text-stone-200 tracking-wide">
            1. Selecciona la duración del destaque
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([7, 15, 30] as const).map((days) => {
              const isSelected = duration === days;
              const price = priceMap[days];
              
              return (
                <button
                  key={days}
                  onClick={() => setDuration(days)}
                  className={`rounded-xl border p-4 text-center cursor-pointer transition-all duration-300 relative ${
                    isSelected
                      ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm ring-2 ring-amber-400/10'
                      : 'border-stone-200 dark:border-stone-850 hover:border-stone-300'
                  }`}
                  type="button"
                >
                  <span className={`block font-display font-black text-lg ${
                    isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-stone-800 dark:text-stone-200'
                  }`}>
                    {days} Días
                  </span>
                  <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase mt-1">
                    ₡{price.toLocaleString()}
                  </span>
                  
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-stone-950 p-0.5 rounded-full shadow-sm">
                      <CheckCircle className="h-3.5 w-3.5 fill-amber-400" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Destaque de Cortesía / Pay via SINPE */}
        {hasFreeSlot ? (
          <div className="rounded-2xl border border-amber-300 bg-amber-500/10 dark:bg-amber-950/20 p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles className="h-32 w-32 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40 border border-amber-300/30">
                <Sparkles className="h-3 w-3" /> Beneficio de Plan {planType}
              </span>
              <h3 className="font-display font-black text-sm uppercase text-stone-850 dark:text-white tracking-wide">
                ¡Destaque de Cortesía Disponible!
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                Dispones de <strong className="text-amber-600 dark:text-amber-450">{featuredCount}</strong> de los <strong className="text-amber-600 dark:text-amber-450">{maxFeatured}</strong> destaques activos incluidos de forma gratuita en tu Plan {planType}.
              </p>
            </div>

            <div className="bg-card-bg border border-card-border rounded-xl p-4 space-y-3 shadow-sm max-w-md">
              <div className="flex justify-between text-xs items-center">
                <span className="text-stone-450 dark:text-stone-500 font-bold uppercase text-[10px]">Costo de Activación</span>
                <span className="font-display font-black text-emerald-700 dark:text-emerald-450 uppercase text-xs">
                  Gratis (Incluido)
                </span>
              </div>
              <div className="flex justify-between text-xs items-center">
                <span className="text-stone-450 dark:text-stone-500 font-bold uppercase text-[10px]">Duración del Destaque</span>
                <span className="font-bold text-stone-750 dark:text-stone-200">
                  {duration} Días
                </span>
              </div>
            </div>

            <form onSubmit={handleActivateFree}>
              <button
                type="submit"
                disabled={activatingFree}
                className="w-full sm:w-auto btn-primary bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 border-amber-400 text-stone-950 hover:text-stone-900 py-3.5 px-8 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md animate-pulse hover:animate-none cursor-pointer"
              >
                {activatingFree ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-stone-950" />
                    <span>Activando Destaque...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 shrink-0 fill-stone-950 text-stone-950" />
                    <span>Activar Destaque de Cortesía (Gratis)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Limit Warning for Paid Plans */}
            {(planType === 'PREMIUM' || planType === 'AGENCY') && (
              <div className="rounded-xl border border-amber-300 bg-amber-500/5 p-4 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-stone-850 dark:text-white mb-0.5">Límite de destaques de cortesía alcanzado</strong>
                  Has alcanzado el cupo máximo de <strong className="text-amber-600 dark:text-amber-450">{maxFeatured} destaques simultáneos</strong> activos en tu Plan {planType}. 
                  Para destacar esta propiedad adicional, puedes adquirir una licencia individual mediante transferencia SINPE Móvil a continuación.
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-card-border bg-card-bg p-6 shadow-sm space-y-6">
              <h3 className="font-display font-black text-sm uppercase text-stone-700 dark:text-stone-200 tracking-wide border-b border-stone-100 dark:border-stone-850 pb-4">
                2. Realiza tu Transferencia SINPE Móvil
              </h3>

              <div className="rounded-xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 p-5 space-y-4">
                <h4 className="font-bold text-xs uppercase text-amber-700 dark:text-amber-450 flex items-center gap-1.5">
                  <AlertCircle className="h-4.5 w-4.5" />
                  Instrucciones de Pago SINPE
                </h4>

                <div className="bg-card-bg border border-card-border rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-stone-450 dark:text-stone-500 font-bold uppercase text-[10px]">Monto Total Destaque</span>
                    <span className="font-display font-black text-lg text-emerald-700 dark:text-emerald-450">
                      ₡{priceMap[duration].toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs items-center">
                    <span className="text-stone-450 dark:text-stone-500 font-bold uppercase text-[10px]">SINPE Móvil</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-stone-800 dark:text-stone-200">+506 6067-7055</span>
                      <button
                        onClick={copyToClipboard}
                        className="text-primary hover:text-primary-dark p-1 rounded hover:bg-stone-50 dark:hover:bg-stone-800"
                        title="Copiar número"
                        type="button"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs items-center">
                    <span className="text-stone-450 dark:text-stone-500 font-bold uppercase text-[10px]">A Nombre De</span>
                    <span className="font-bold text-stone-700 dark:text-stone-300">Cristian Vindas</span>
                  </div>
                </div>
              </div>

              {/* Form to submit Receipt */}
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-stone-400 dark:text-stone-550 block">Subir Comprobante SINPE *</label>
                  
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                    receiptBase64
                      ? 'border-emerald-450 bg-emerald-50/10'
                      : 'border-stone-250 dark:border-stone-850 hover:border-amber-450'
                  } relative`}>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {compressing ? (
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Optimizando imagen...</span>
                      </div>
                    ) : receiptBase64 ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-8 w-8 text-emerald-500 animate-bounce" />
                        <span className="text-xs font-bold text-stone-850 dark:text-stone-200">{receiptName}</span>
                        <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded">¡Listo para enviar!</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-stone-400">
                        <FileImage className="h-8 w-8 text-stone-350" />
                        <span className="text-xs font-bold text-stone-750 dark:text-stone-300">Arrastra o selecciona la captura del SINPE</span>
                        <span className="text-[9px] uppercase tracking-wider text-stone-400">Formatos JPG, PNG (Max 10MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || compressing || !receiptBase64}
                  className="w-full btn-primary py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Enviando Comprobante...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
                      <span>Solicitar Destaque de Anuncio</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
