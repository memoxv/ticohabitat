'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { getTranslations } from '@/lib/translations';
import { Heart, MessageSquare, CheckCircle2, Sparkles, Phone } from 'lucide-react';
import TranslatedText from './TranslatedText';


export interface PropertyCardProps {
  id: string;
  type: string; // 'buy' | 'rent'
  propertyType: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  province: string;
  canton?: string | null;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  petsAllowed: boolean;
  featured: boolean;
  verified: boolean;
  imageUrl?: string | null;
  contactPhone: string;
  whatsapp?: string | null;
}

export default function PropertyCard({ property }: { property: PropertyCardProps }) {
  const router = useRouter();
  const { toggleFavorite, isFavorite, language } = useApp();
  const t = getTranslations(language);
  const favorited = isFavorite(property.id);

  const formattedPrice = property.currency === 'CRC' || property.currency === 'CRC'
    ? `₡${property.price.toLocaleString('es-CR')}`
    : `$${property.price.toLocaleString('en-US')}`;

  const typeLabel = property.type === 'buy' ? t.common.buy : t.common.rent;
  
  const propertyTypeLabel = t.card.propertyTypes[property.propertyType as keyof typeof t.card.propertyTypes] || t.card.propertyTypes.other;

  const specsArray = [];
  if (property.propertyType !== 'lot' && property.propertyType !== 'commercial' && property.bedrooms > 0) {
    const bedsText = property.bedrooms === 1 
      ? t.card.specs.bedrooms.replace('{count}', '1')
      : t.card.specs.bedroomsPlural.replace('{count}', String(property.bedrooms));
    specsArray.push(bedsText);
  }
  if (property.propertyType !== 'lot') {
    if (property.bathrooms > 0) {
      const bathsText = property.bathrooms === 1
        ? t.card.specs.bathrooms.replace('{count}', '1')
        : t.card.specs.bathroomsPlural.replace('{count}', String(property.bathrooms));
      specsArray.push(bathsText);
    }
    if (property.parkingSpaces > 0) {
      const parkText = property.parkingSpaces === 1
        ? t.card.specs.parking.replace('{count}', '1')
        : t.card.specs.parkingPlural.replace('{count}', String(property.parkingSpaces));
      specsArray.push(parkText);
    }
  }
  const specsText = specsArray.join(' · ');

  const cleanPhoneDigits = (property.whatsapp || property.contactPhone || '').replace(/\D/g, '');
  const hasContactPhone = cleanPhoneDigits.slice(-8).length === 8;
  const cleanPhone = cleanPhoneDigits.slice(-8);

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!hasContactPhone) return;

    // Track click on WhatsApp
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'whatsapp_click', propertyId: property.id }),
    }).catch(console.error);

    const priceText = property.currency === 'USD'
      ? `$${property.price.toLocaleString('en-US')}`
      : `₡${property.price.toLocaleString('es-CR')}`;
    const locationText = property.canton
      ? `${property.province}, ${property.canton}`
      : property.province;
    
    const whatsappTemplate = t.card.whatsappMessageTemplate;
    const text = whatsappTemplate
      .replace('{propertyType}', propertyTypeLabel)
      .replace('{title}', property.title)
      .replace('{price}', priceText)
      .replace('{location}', locationText)
      .replace('{slug}', property.slug);

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const waUrl = isMobile 
      ? `whatsapp://send?phone=506${cleanPhone}&text=${encodeURIComponent(text)}`
      : `https://wa.me/506${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    
    // Track click on Phone
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'phone_click', propertyId: property.id }),
    }).catch(console.error);
  };

  const reportText = t.card.reportWhatsappMsg.replace('{phone}', property.contactPhone);
  const reportUrl = `https://wa.me/50660677055?text=${encodeURIComponent(reportText)}`;

  return (
    <div className="group relative flex flex-col bg-card-bg rounded-3xl overflow-hidden hover-lift shadow-[0_12px_30px_-10px_rgba(15,22,19,0.02)] transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
      {/* Property Image Cover - uses div+onClick to avoid nested <a> from tooltip */}
      <div
        onClick={() => router.push(`/${language}/propiedad/${property.slug}`)}
        className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-stone-850 block rounded-t-3xl cursor-pointer"
        role="link"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/${language}/propiedad/${property.slug}`); }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.imageUrl || 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=80'}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
          loading="lazy"
        />
        
        {/* Type Overlay Badge (Softer Airbnb-like styling) */}
        <span className={`absolute top-4 left-4 z-10 rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white shadow-sm ${
          property.type === 'buy' ? 'bg-stone-950/90' : 'bg-emerald-800/90'
        }`}>
          {typeLabel}
        </span>

        {/* Feature/Verified Bottom badges */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-1">
          {property.featured && (
            <span className="badge-premium bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-stone-950 font-black border border-amber-300 shadow-md flex items-center gap-1">
              <Sparkles className="h-3 w-3 fill-stone-950 text-stone-950 shrink-0" />
              <span>{t.card.featuredBadge}</span>
            </span>
          )}
          {property.verified && (
            <div className="relative group/tooltip" onClick={(e) => e.stopPropagation()}>
              <span 
                className="badge-verified relative overflow-visible cursor-help inline-flex items-center"
              >
                <span className="relative flex h-1.5 w-1.5 mr-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                <CheckCircle2 className="h-3 w-3 shrink-0 mr-0.5" />
                <span>{t.card.verifiedBadge}</span>
              </span>
              
              {/* Trust Tooltip content */}
              <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-stone-950 text-white rounded-xl border border-stone-800 shadow-2xl opacity-0 translate-y-1 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 transition-all duration-200 z-50 text-[10px] leading-relaxed">
                <div className="font-bold text-emerald-400 flex items-center gap-1 mb-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  <span>{t.card.verifiedTooltipTitle}</span>
                </div>
                <p className="text-stone-300">
                  {t.card.verifiedTooltipDesc}
                </p>
                <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-stone-400 font-mono flex items-center justify-between">
                  <span>{language === 'en' ? 'EMAIL SECURITY' : 'SEGURIDAD CORREO'}</span>
                  <span className="text-emerald-450 font-black">{t.card.verifiedTooltipStatus}</span>
                </div>
                <div className="mt-2.5 pt-2 border-t border-white/5 text-[8.5px] text-stone-400 leading-relaxed font-sans">
                  {t.card.reportWarning} <a href={reportUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-450 font-bold hover:underline">{t.card.reportLinkText}</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Favorite Button (floating, positioned nicely) */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(property.id);
          }}
          className={`flex h-8.5 w-8.5 items-center justify-center rounded-full bg-white/95 dark:bg-stone-900/95 border border-stone-200/30 dark:border-stone-850/30 text-stone-700 dark:text-stone-300 transition-all duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 shadow-sm hover:text-red-500 cursor-pointer backdrop-blur-xs`}
          aria-label={favorited ? t.card.removeFavorite : t.card.saveFavorite}
        >
          <Heart className={`h-4 w-4 transition-colors ${favorited ? 'fill-red-500 text-red-500' : ''}`} />
        </button>
      </div>

      {/* Property Details Info */}
      <div className="flex flex-1 flex-col p-6 bg-card-bg rounded-b-3xl">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          {/* Price - Beautifully Highlighted in Black Absolute */}
          <div className="text-xl font-black tracking-tight text-stone-950 dark:text-white font-sans tabular-nums">
            {formattedPrice}
          </div>
          {/* Property Type tag */}
          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
            {propertyTypeLabel}
          </span>
        </div>

        {/* Title - Linkable */}
        <h3 className="font-sans font-bold text-stone-850 dark:text-stone-100 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors text-sm line-clamp-1 mb-1.5 leading-snug">
          <Link href={`/${language}/propiedad/${property.slug}`}>
            <TranslatedText text={property.title} />
          </Link>
        </h3>

        {/* Location */}
        <p className="text-[11px] font-semibold text-stone-450 dark:text-stone-500">
          {property.province}{property.canton ? `, ${property.canton}` : ''}
        </p>

        {/* Details stats (Simplified Textual line) */}
        <div className="mt-5 pt-4 border-t border-stone-100/70 dark:border-stone-850/50 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-stone-450 dark:text-stone-400 tracking-wide max-w-[120px] truncate">
            {specsText || t.card.verifiedAd}
            {property.petsAllowed && ' · 🐾'}
          </span>

          {hasContactPhone && (
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Direct Call Button (Sleek circular icon button) */}
              <a
                href={`tel:+506${cleanPhone}`}
                onClick={handlePhoneClick}
                className="w-8 h-8 rounded-full border border-stone-250 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-900/50 cursor-pointer flex items-center justify-center transition-all active:scale-90"
                title={t.card.callDirectly}
              >
                <Phone className="h-3.5 w-3.5 text-stone-400 dark:text-stone-550" />
              </a>

              {/* Contact WhatsApp Button (Sleek emerald circular CTA) */}
              <button
                onClick={handleWhatsAppClick}
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer flex items-center justify-center active:scale-90 shadow-sm transition-all duration-300"
                title={t.card.contactWhatsapp}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
