'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { upgradePlanTransactionAction } from '@/app/actions/monetization';
import {
  Sparkles,
  Building,
  Check,
  Zap,
  CreditCard,
  Copy,
  CheckCircle,
  AlertCircle,
  FileImage,
  Loader2,
  Calendar,
  Building2,
} from 'lucide-react';

interface PlanesClientProps {
  currentPlan: {
    type: string;
    expiresAt: string | null;
    agencyName: string | null;
    agencyLogo: string | null;
  };
  pastTransactions: {
    id: string;
    amount: number;
    type: string;
    status: string;
    notes: string | null;
    createdAt: string;
  }[];
}

export default function PlanesClient({ currentPlan, pastTransactions }: PlanesClientProps) {
  const { showToast } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'PREMIUM' | 'AGENCY' | null>(null);
  const [agencyName, setAgencyName] = useState('');
  const [agencyLogoBase64, setAgencyLogoBase64] = useState('');
  const [receiptBase64, setReceiptBase64] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPromoActive = typeof window !== 'undefined' 
    ? new Date() < new Date('2026-07-01T00:00:00')
    : true; // SSR default to promo active during June 2026

  const priceMap = {
    PREMIUM: isPromoActive ? 12500 : 25000,
    AGENCY: isPromoActive ? 38500 : 55000,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText('+50660677055');
    setCopied(true);
    showToast('Número SINPE Móvil copiado al portapapeles.', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  // Compress image helper using canvas
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'receipt' | 'logo') => {
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
        const MAX_WIDTH = type === 'receipt' ? 900 : 300;
        const MAX_HEIGHT = type === 'receipt' ? 900 : 300;
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

        // Convert to highly optimized base64 jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

        if (type === 'receipt') {
          setReceiptBase64(dataUrl);
          setReceiptName(file.name);
        } else {
          setAgencyLogoBase64(dataUrl);
        }
        setCompressing(false);
      };
    };
    reader.onerror = () => {
      showToast('Error al leer el archivo de imagen.', 'error');
      setCompressing(false);
    };
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!receiptBase64) {
      showToast('Por favor cargue el comprobante de su transferencia SINPE.', 'error');
      return;
    }
    if (selectedPlan === 'AGENCY' && !agencyName.trim()) {
      showToast('El nombre de la inmobiliaria es obligatorio para el Plan Agencia.', 'error');
      return;
    }

    setSubmitting(true);
    const res = await upgradePlanTransactionAction({
      planType: selectedPlan,
      amount: priceMap[selectedPlan],
      receiptBase64,
      agencyName: selectedPlan === 'AGENCY' ? agencyName : undefined,
      agencyLogo: selectedPlan === 'AGENCY' ? agencyLogoBase64 : undefined,
    });
    setSubmitting(false);

    if (res.success) {
      showToast(res.message, 'success');
      // Reset form
      setReceiptBase64('');
      setReceiptName('');
      setAgencyName('');
      setAgencyLogoBase64('');
      setSelectedPlan(null);
    } else {
      showToast(res.message || 'Ocurrió un error al procesar su comprobante.', 'error');
    }
  };

  return (
    <div className="space-y-12">

      {/* Visual Plans Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">

        {/* FREE PLAN */}
        <div className="rounded-2xl border border-card-border bg-card-bg p-8 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 duration-300">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 bg-stone-100 dark:bg-stone-800 px-3 py-1 rounded-full">
              Básico
            </span>
            <h3 className="font-display font-bold text-xl text-stone-900 dark:text-white mt-4">
              Plan Gratis
            </h3>
            <p className="text-xs text-stone-500 mt-2">
              Para propietarios individuales que desean vender o alquilar una propiedad ocasional.
            </p>

            <div className="my-8 flex items-baseline gap-1 text-stone-900 dark:text-white">
              <span className="text-3xl font-black font-display tracking-tight">₡0</span>
              <span className="text-xs font-bold text-stone-400">/ para siempre</span>
            </div>

            <ul className="space-y-4 border-t border-stone-100 dark:border-stone-850 pt-6">
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Hasta 3 publicaciones simultáneas</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Verificación por OTP</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Destaques individuales disponibles para compra</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-450 dark:text-stone-500 line-through">
                <span>Estadísticas individuales por propiedad</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-450 dark:text-stone-500 line-through">
                <span>Logotipos o branding personalizado</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6">
            <div className="w-full text-center py-3 text-xs font-black uppercase text-stone-400 bg-stone-50 dark:bg-stone-950/20 rounded-xl border border-stone-150 dark:border-stone-800">
              {currentPlan.type === 'FREE' ? 'Tu Plan Activo' : 'Suscripción Básica'}
            </div>
          </div>
        </div>

        {/* PREMIUM PLAN (GOLD GLOW) */}
        <div className="rounded-2xl border-2 border-amber-400 bg-card-bg p-8 flex flex-col justify-between shadow-md relative overflow-hidden transition-all hover:-translate-y-1 duration-300 ring-4 ring-amber-400/5">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-stone-950 font-black text-[9px] uppercase tracking-wider py-1.5 px-6 rounded-bl-xl shadow-sm flex items-center gap-1">
            <Sparkles className="h-3 w-3 fill-stone-950" />
            <span>El Más Popular</span>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-full border border-amber-250/25">
              Premium ⭐
            </span>
            <h3 className="font-display font-bold text-xl text-stone-900 dark:text-white mt-4">
              Corredor Premium
            </h3>
            <p className="text-xs text-stone-500 mt-2">
              Para corredores independientes en Costa Rica que desean acelerar sus ventas y captar más leads.
            </p>

            <div className="my-8 flex flex-col gap-1.5 font-display min-h-[72px] justify-center">
              {isPromoActive ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 dark:text-stone-550 line-through text-xs font-bold">₡25,000</span>
                    <span className="bg-emerald-500/10 border border-emerald-400/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">¡50% DESC. Lanzamiento!</span>
                  </div>
                  <div className="flex items-baseline gap-1 text-emerald-700 dark:text-emerald-450">
                    <span className="text-4xl font-black tracking-tight">₡12,500</span>
                    <span className="text-xs font-bold text-stone-400">/ 30 días</span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-1 text-emerald-700 dark:text-emerald-450">
                  <span className="text-4xl font-black tracking-tight">₡25,000</span>
                  <span className="text-xs font-bold text-stone-400">/ 30 días</span>
                </div>
              )}
            </div>

            <ul className="space-y-4 border-t border-stone-150 dark:border-stone-800 pt-6">
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300 font-semibold">
                <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Publicaciones activas ILIMITADAS</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Badge de "Corredor Verificado" premium</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Posicionamiento prioritario en búsquedas</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Estadísticas Avanzadas de Visualizaciones y WhatsApp</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Incluye 3 destaques dorados activos simultáneos (Gratis)</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6">
            {currentPlan.type === 'PREMIUM' ? (
              <div className="w-full text-center py-3 text-xs font-black uppercase text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-250 flex items-center justify-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                <span>Plan Premium Activo</span>
              </div>
            ) : (
              <button
                onClick={() => setSelectedPlan('PREMIUM')}
                className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm ${selectedPlan === 'PREMIUM'
                    ? 'bg-amber-500 text-stone-900 border border-amber-400'
                    : 'bg-stone-900 text-white hover:bg-amber-500 hover:text-stone-900 dark:bg-white dark:text-stone-900 dark:hover:bg-amber-500 dark:hover:text-stone-900'
                  }`}
              >
                {selectedPlan === 'PREMIUM' ? 'Completar Abajo' : 'Adquirir Premium'}
              </button>
            )}
          </div>
        </div>

        {/* AGENCY PLAN (EMERALD GLOW) */}
        <div className="rounded-2xl border border-card-border bg-card-bg p-8 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:-translate-y-1 duration-300 hover:border-emerald-50 hover:shadow-emerald-50/5 hover:shadow-lg">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1 rounded-full border border-emerald-200/25">
              Agencia / Inmobiliaria 🏢
            </span>
            <h3 className="font-display font-bold text-xl text-stone-900 dark:text-white mt-4">
              Plan Inmobiliaria
            </h3>
            <p className="text-xs text-stone-500 mt-2">
              La cabina profesional definitiva para agencias con múltiples corredores y presencia de marca premium.
            </p>

            <div className="my-8 flex flex-col gap-1.5 font-display min-h-[72px] justify-center">
              {isPromoActive ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 dark:text-stone-550 line-through text-xs font-bold">₡55,000</span>
                    <span className="bg-emerald-500/10 border border-emerald-400/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">¡30% DESC. Lanzamiento!</span>
                  </div>
                  <div className="flex items-baseline gap-1 text-emerald-700 dark:text-emerald-450">
                    <span className="text-4xl font-black tracking-tight">₡38,500</span>
                    <span className="text-xs font-bold text-stone-400">/ 30 días</span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-1 text-emerald-700 dark:text-emerald-450">
                  <span className="text-4xl font-black tracking-tight">₡55,000</span>
                  <span className="text-xs font-bold text-stone-400">/ 30 días</span>
                </div>
              )}
            </div>

            <ul className="space-y-4 border-t border-stone-150 dark:border-stone-800 pt-6">
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300 font-semibold">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Hasta 5 cuentas de agentes inmobiliarios</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Branding destacado (logotipo en sus fichas)</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Incluye 8 destaques dorados activos simultáneos (Gratis)</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300 font-medium">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Posicionamiento de marca en el Directorio de Agencias</span>
              </li>
              <li className="flex items-start gap-3 text-xs text-stone-600 dark:text-stone-300">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Panel de control corporativo centralizado</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6">
            {currentPlan.type === 'AGENCY' ? (
              <div className="w-full text-center py-3 text-xs font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-250 flex items-center justify-center gap-1.5">
                <Building className="h-4 w-4" />
                <span>Plan Agencia Activo ({currentPlan.agencyName || 'Inmobiliaria'})</span>
              </div>
            ) : (
              <button
                onClick={() => setSelectedPlan('AGENCY')}
                className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm ${selectedPlan === 'AGENCY'
                    ? 'bg-emerald-600 text-white border border-emerald-500'
                    : 'bg-stone-900 text-white hover:bg-emerald-600 hover:text-white dark:bg-white dark:text-stone-900 dark:hover:bg-emerald-600 dark:hover:text-white'
                  }`}
              >
                {selectedPlan === 'AGENCY' ? 'Completar Abajo' : 'Adquirir Agencia'}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Collapsible SINPE Checkout Drawer */}
      {selectedPlan && (
        <div className="rounded-2xl border border-card-border bg-card-bg p-8 shadow-md animate-slideUp">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-850 pb-5 mb-6">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-stone-900 dark:text-white">
                  Formulario de Pago SINPE Móvil
                </h3>
                <p className="text-xs text-stone-500">
                  Estás solicitando la activación manual del plan: <strong className="text-stone-800 dark:text-stone-200 uppercase">{selectedPlan === 'PREMIUM' ? 'Premium ⭐' : 'Inmobiliaria 🏢'}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlan(null)}
              className="text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-wider border border-stone-200 rounded px-2.5 py-1 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* SINPE Transfer instructions */}
            <div className="space-y-6">
              <div className="rounded-xl bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 p-6 space-y-4">
                <h4 className="font-bold text-xs uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4.5 w-4.5" />
                  Instrucciones de Transferencia Manual
                </h4>

                <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                  Para completar su solicitud, por favor realice el SINPE Móvil correspondiente y adjunte el comprobante digital bancario en el formulario lateral.
                </p>

                <div className="bg-card-bg border border-card-border rounded-xl p-4 space-y-3 shadow-sm">
                  <div className="flex justify-between text-xs items-center">
                    <span className="text-stone-450 dark:text-stone-500 font-bold uppercase text-[10px]">Monto del Depósito</span>
                    <span className="font-display font-black text-lg text-emerald-700 dark:text-emerald-450">
                      ₡{priceMap[selectedPlan].toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs items-center">
                    <span className="text-stone-450 dark:text-stone-500 font-bold uppercase text-[10px]">SINPE Móvil Destino</span>
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
                    <span className="font-bold text-stone-700 dark:text-stone-300">TicoHabitat</span>
                  </div>
                </div>

                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed bg-amber-50 dark:bg-amber-950/20 px-3.5 py-2.5 rounded border border-amber-250/20">
                  <strong>IMPORTANTE:</strong> Tras subir su comprobante, la verificación tarda de 5 a 15 minutos en horario diurno. Recibirá un distintivo dorado y acceso ilimitado inmediato tras la aprobación del administrador.
                </div>
              </div>
            </div>

            {/* SINPE Form Fields */}
            <form onSubmit={handleSubmitCheckout} className="space-y-5">

              {/* Extra data for Inmobiliaria */}
              {selectedPlan === 'AGENCY' && (
                <div className="space-y-4 rounded-xl border border-card-border p-5 bg-background">
                  <h4 className="text-xs font-black uppercase text-stone-700 dark:text-stone-200 flex items-center gap-1">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    Detalles de su Inmobiliaria
                  </h4>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400 dark:text-stone-500">Nombre de la Inmobiliaria *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Inmobiliaria del Valle"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      className="w-full text-xs font-sans rounded-lg border border-stone-200 dark:border-stone-800 dark:bg-stone-900 dark:text-white p-3 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-stone-400 dark:text-stone-550 block">Logotipo Corporativo (Opcional)</label>
                    <div className="flex items-center gap-3">
                      {agencyLogoBase64 && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={agencyLogoBase64}
                          alt="Logo preview"
                          className="h-10 w-10 object-cover rounded-lg border border-stone-200 shadow-sm"
                        />
                      )}
                      <label className="border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 px-4 py-2.5 rounded-lg text-[10px] uppercase font-bold tracking-wider cursor-pointer text-stone-700 dark:text-stone-300">
                        {agencyLogoBase64 ? 'Cambiar Logo' : 'Subir Logotipo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'logo')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Receipt Form */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-stone-400 dark:text-stone-550 block">Subir Comprobante de SINPE *</label>

                <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${receiptBase64
                    ? 'border-emerald-450 bg-emerald-50/10'
                    : 'border-stone-250 dark:border-stone-800 hover:border-primary'
                  } relative`}>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => handleImageUpload(e, 'receipt')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {compressing ? (
                    <div className="flex flex-col items-center gap-2 text-stone-400">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Optimizando comprobante...</span>
                    </div>
                  ) : receiptBase64 ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="h-8 w-8 text-emerald-500 animate-bounce" />
                      <span className="text-xs font-bold text-stone-850 dark:text-stone-200">{receiptName}</span>
                      <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded">¡Cargado y Comprimido!</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-stone-400">
                      <FileImage className="h-8 w-8 text-stone-350" />
                      <span className="text-xs font-bold text-stone-750 dark:text-stone-300">Arrastre o seleccione la captura del SINPE</span>
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
                    <Zap className="h-4 w-4 shrink-0" />
                    <span>Enviar Comprobante SINPE</span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      {pastTransactions.length > 0 && (
        <div className="rounded-2xl border border-card-border bg-card-bg p-8 shadow-sm">
          <h3 className="font-display font-black text-base text-stone-900 dark:text-white mb-6 uppercase tracking-wide">
            Historial de Solicitudes de Planes
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-100 dark:border-stone-850 text-stone-400 font-bold uppercase text-[9px] tracking-wider">
                  <th className="pb-3 pr-4 font-black">ID Pago</th>
                  <th className="pb-3 px-4 font-black">Plan Solicitado</th>
                  <th className="pb-3 px-4 font-black">Monto</th>
                  <th className="pb-3 px-4 font-black">Fecha</th>
                  <th className="pb-3 px-4 font-black text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
                {pastTransactions.map((tx) => (
                  <tr key={tx.id} className="text-stone-700 dark:text-stone-300">
                    <td className="py-4 pr-4 font-mono font-bold text-[10px] text-stone-400">
                      {tx.id.substring(0, 8)}...
                    </td>
                    <td className="py-4 px-4 font-bold uppercase">
                      {tx.type === 'premium_plan' ? 'Premium ⭐' : 'Inmobiliaria 🏢'}
                    </td>
                    <td className="py-4 px-4 font-bold text-stone-900 dark:text-white">
                      ₡{tx.amount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-medium text-stone-450">
                      {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`inline-block rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${tx.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-450'
                          : tx.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-450'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-450'
                        }`}>
                        {tx.status === 'approved' ? 'Aprobado' : tx.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                      {tx.notes && tx.status === 'rejected' && (
                        <span className="block text-[10px] text-red-500 font-medium mt-1 font-sans">
                          Razon: {tx.notes}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
