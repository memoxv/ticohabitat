'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { reportPropertyAction } from '@/app/actions/properties';
import { Heart, MessageSquare, ShieldAlert, Flag, X, Sparkles, Building, CheckCircle2, Phone } from 'lucide-react';

interface PropertyDetailsClientProps {
  property: {
    id: string;
    title: string;
    slug: string;
    type: string;
    propertyType: string;
    price: number;
    currency: string;
    province: string;
    canton?: string | null;
    district?: string | null;
    bedrooms: number;
    bathrooms: number;
    parkingSpaces: number;
    areaM2: number;
    petsAllowed: boolean;
    furnished: boolean;
    condominium: boolean;
    contactPhone: string;
    whatsapp: string;
    user: {
      name: string | null;
      email: string;
      planType: string;
      agencyName?: string | null;
      agencyLogo?: string | null;
    };
  };
}

export default function PropertyDetailsClient({ property }: PropertyDetailsClientProps) {
  const { toggleFavorite, isFavorite, showToast } = useApp();
  const favorited = isFavorite(property.id);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const propertyTypeLabel = {
    house: 'Casa',
    apartment: 'Apartamento',
    lot: 'Lote/Terreno',
    commercial: 'Local Comercial',
    other: 'Propiedad',
  }[property.propertyType] || 'Propiedad';

  const handleWhatsAppClick = () => {
    // Record WhatsApp metric
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'whatsapp_click', propertyId: property.id }),
    }).catch(console.error);

    // Form Costa Rican WhatsApp link using the registered WhatsApp number (or contactPhone as fallback)
    const targetPhone = property.whatsapp || property.contactPhone || '';
    const cleanPhone = targetPhone.replace(/\D/g, '').slice(-8);
    if (cleanPhone.length !== 8) {
      showToast('Esta propiedad no cuenta con un número de WhatsApp verificado de 8 dígitos.', 'error');
      return;
    }
    const priceText = property.currency === 'USD' 
      ? `$${property.price.toLocaleString('en-US')}` 
      : `₡${property.price.toLocaleString('es-CR')}`;
    const locationText = property.canton 
      ? `${property.province}, ${property.canton}` 
      : property.province;

    const text = `👋 *¡Hola!*\n\nVi tu anuncio en *TicoHabitat* 🏡\n👉 *${propertyTypeLabel}:* ${property.title}\n💰 *Precio:* ${priceText}\n📍 *Ubicación:* ${locationText}\n\n¿Sigue disponible para coordinar una visita?\n\n🔗 *Enlace:* https://www.ticohabitat.com/propiedad/${property.slug}`;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const waUrl = isMobile 
      ? `whatsapp://send?phone=506${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://wa.me/506${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handlePhoneClick = () => {
    // Record Direct Call metric
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'phone_click', propertyId: property.id }),
    }).catch(console.error);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReport(true);
    
    const res = await reportPropertyAction(property.id, reportReason, reportDetails);
    
    setSubmittingReport(false);
    setReportModalOpen(false);
    
    if (res.success) {
      showToast(res.message, 'success');
      setReportDetails('');
    } else {
      showToast(res.message || 'No se pudo enviar el reporte.', 'error');
    }
  };

  const cleanPhoneDigits = (property.whatsapp || property.contactPhone || '').replace(/\D/g, '');
  const hasContactPhone = cleanPhoneDigits.slice(-8).length === 8;

  return (
    <div className="flex flex-col gap-6">      {/* Dynamic Action Area with perfect vertical stacking for sidebars */}
      <div className="flex flex-col gap-3 w-full">
        {/* Giant WhatsApp Conversion Button */}
        {hasContactPhone && (
          <button
            onClick={handleWhatsAppClick}
            className="group relative w-full flex items-center justify-between rounded-full bg-emerald-600 hover:bg-emerald-500 text-white pl-6 pr-2 py-2 text-xs font-black transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer shadow-[0_12px_24px_-8px_rgba(16,185,129,0.3)] hover:shadow-[0_16px_28px_-6px_rgba(16,185,129,0.4)] active:scale-[0.97] outline-none"
          >
            <span>Contactar por WhatsApp</span>
            <div className="w-8 h-8 rounded-full bg-white/15 dark:bg-white/20 flex items-center justify-center text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <MessageSquare className="h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-12" />
            </div>
          </button>
        )}

        {/* Giant Direct Call Button */}
        {hasContactPhone && (
          <a
            href={`tel:+506${cleanPhoneDigits.slice(-8)}`}
            onClick={handlePhoneClick}
            className="group relative w-full flex items-center justify-between rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-150 pl-6 pr-2 py-2 text-xs font-black transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] active:scale-[0.97] outline-none border border-stone-250 dark:border-stone-750/60"
          >
            <span>Llamar por Teléfono</span>
            <div className="w-8 h-8 rounded-full bg-stone-200/50 dark:bg-stone-700/50 flex items-center justify-center text-stone-750 dark:text-stone-300 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <Phone className="h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-12" />
            </div>
          </a>
        )}

        {/* Supplementary Row: Favorites & Report */}
        <div className="flex items-center gap-2 mt-1">
          {/* Favorite Button (Expanded with explicit call-to-action text) */}
          <button
            onClick={() => toggleFavorite(property.id)}
            className={`flex-grow flex h-11 items-center justify-center gap-2 rounded-xl border transition-all cursor-pointer text-xs font-bold active:scale-95 ${
              favorited
                ? 'bg-red-500 text-white border-red-500 shadow'
                : 'bg-card-bg border-card-border text-stone-750 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60'
            }`}
            aria-label={favorited ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
            title={favorited ? 'Eliminar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart className={`h-4 w-4 ${favorited ? 'fill-current' : ''}`} />
            <span>{favorited ? 'Favorito guardado' : 'Guardar en Favoritos'}</span>
          </button>

          {/* Muted Report Button (Low visual weight) */}
          <button
            onClick={() => setReportModalOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-card-border bg-card-bg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
            title="Reportar este anuncio"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Advertiser info box - Clean stone / Dynamic Premium branding */}
      {property.user.planType === 'PREMIUM' && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50/50 to-yellow-50/20 dark:from-amber-950/10 dark:to-stone-900/40 border border-amber-250/30 dark:border-amber-900/50 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-[10px] uppercase tracking-wider text-amber-700 dark:text-amber-400">Información del Anunciante</h3>
            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-220 px-2 py-0.5 text-[8px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
              <Sparkles className="h-3 w-3 fill-amber-500 text-amber-500 animate-pulse" />
              <span>Corredor Premium</span>
            </span>
          </div>
          <p className="text-sm font-bold text-stone-850 dark:text-stone-100">
            {property.user.name || 'Agente Premium'}
          </p>
          <div className="space-y-1.5 pt-1 border-t border-stone-100/50 dark:border-stone-850/30">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-450 dark:text-stone-550 font-mono">
              <span>Anunciante verificado por correo</span>
            </div>
            <div className="text-[9px] text-stone-400 dark:text-stone-500 leading-relaxed font-sans">
              ¿Número incorrecto? <a href={`https://wa.me/50660677055?text=Mi%20n%C3%BAmero%20${encodeURIComponent(property.contactPhone)}%20est%C3%A1%20registrado%20en%20TicoHabitat%20por%20alguien%20que%20no%20es%20el%20due%C3%B1o`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-450 font-bold hover:underline">Reportar por WhatsApp ➔</a>
            </div>
          </div>
        </div>
      )}

      {property.user.planType === 'AGENCY' && (
        <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-50/30 to-slate-50/50 dark:from-emerald-950/10 dark:to-stone-900/40 border border-emerald-250/20 dark:border-emerald-900/50 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-[10px] uppercase tracking-wider text-emerald-850 dark:text-emerald-400">Inmobiliaria Asociada</h3>
            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-500/10 border border-emerald-250 px-2.5 py-0.5 text-[8px] font-black uppercase text-emerald-800 dark:text-emerald-450 tracking-wider">
              <Building className="h-3 w-3 text-emerald-600" />
              <span>Agencia Verificada</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {property.user.agencyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={property.user.agencyLogo}
                alt={property.user.agencyName || 'Logo Inmobiliaria'}
                className="h-11 w-11 object-cover rounded-xl border border-card-border shadow-sm bg-card-bg"
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 border border-stone-200 dark:border-stone-800">
                <Building className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-black text-stone-850 dark:text-white uppercase tracking-wide">
                {property.user.agencyName || 'Inmobiliaria Tica'}
              </p>
              <p className="text-[10px] font-medium text-stone-450 dark:text-stone-400">
                Agente: {property.user.name || 'Asesor Profesional'}
              </p>
            </div>
          </div>
          
          <div className="space-y-1.5 border-t border-stone-100 dark:border-stone-850 pt-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-450 dark:text-stone-550 font-mono">
              <span>Anunciante verificado por correo</span>
            </div>
            <div className="text-[9px] text-stone-400 dark:text-stone-500 leading-relaxed font-sans">
              ¿Número incorrecto? <a href={`https://wa.me/50660677055?text=Mi%20n%C3%BAmero%20${encodeURIComponent(property.contactPhone)}%20est%C3%A1%20registrado%20en%20TicoHabitat%20por%20alguien%20que%20no%20es%20el%20due%C3%B1o`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-450 font-bold hover:underline">Reportar por WhatsApp ➔</a>
            </div>
          </div>
        </div>
      )}

      {property.user.planType !== 'PREMIUM' && property.user.planType !== 'AGENCY' && (
        <div className="p-5 rounded-xl bg-background border border-card-border space-y-2.5">
          <div className="space-y-1">
            <h3 className="font-display font-bold text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-550 mb-2">Información del Anunciante</h3>
            <p className="text-sm font-bold text-stone-850 dark:text-stone-200">{property.user.name || 'Propietario Independiente'}</p>
          </div>
          <div className="space-y-1.5 border-t border-stone-100 dark:border-stone-850 pt-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-450 dark:text-stone-550 font-mono">
              <span>Anunciante verificado por correo</span>
            </div>
            <div className="text-[9px] text-stone-400 dark:text-stone-500 leading-relaxed font-sans">
              ¿Número incorrecto? <a href={`https://wa.me/50660677055?text=Mi%20n%C3%BAmero%20${encodeURIComponent(property.contactPhone)}%20est%C3%A1%20registrado%20en%20TicoHabitat%20por%20alguien%20que%20no%20es%20el%20due%C3%B1o`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-450 font-bold hover:underline">Reportar por WhatsApp ➔</a>
            </div>
          </div>
        </div>
      )}

      {/* 4. Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/60 backdrop-blur-[2px] p-4 animate-fadeIn">
          <div className="bg-card-bg rounded-xl max-w-md w-full border border-card-border p-6.5 shadow-xl animate-slideIn">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-stone-100 dark:border-stone-850">
              <h3 className="font-display text-lg font-bold text-stone-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                <span>Reportar Propiedad</span>
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Motivo del reporte</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="input-premium py-3 cursor-pointer"
                >
                  <option value="spam">Anuncio duplicado o Spam</option>
                  <option value="fraud">Sospecha de estafa / Datos falsos</option>
                  <option value="sold_rented">La propiedad ya se vendió o alquiló</option>
                  <option value="wrong_details">Precio, ubicación o características erróneas</option>
                  <option value="offensive">Contenido ofensivo o inapropiado</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Detalles adicionales (opcional)</label>
                <textarea
                  placeholder="Describe brevemente el problema detectado con esta publicación..."
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  rows={4}
                  className="input-premium py-3 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-850 mt-4">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="btn-danger py-2.5 px-5 text-xs text-white bg-red-600 hover:bg-red-700 border-transparent shadow cursor-pointer"
                >
                  {submittingReport ? 'Enviando...' : 'Enviar Reporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
