import React from 'react';
import Link from 'next/link';
import { getProperties, getRandomFeaturedPropertiesAction } from '@/lib/properties';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { Compass, Award, ShieldCheck, MessageSquare, Building } from 'lucide-react';
import { db } from '@/lib/db';
import { getTranslations } from '@/lib/translations';
import { getServerLanguage } from '@/lib/serverTranslations';

export const revalidate = 0; // Fresh content always

const PROVINCES = [
  { name: 'San José', slug: 'san-jose', count: 184, image: '/regions/sanjose.png', desc: 'Vistas del Valle Central y torres exclusivas en Sabana, Escazú y Santa Ana.' },
  { name: 'Alajuela', slug: 'alajuela', count: 142, image: '/regions/alajuela.png', desc: 'Cafetales y quintas cálidas en las faldas de Poás, Atenas y San Ramón.' },
  { name: 'Heredia', slug: 'heredia', count: 98, image: '/regions/heredia.png', desc: 'Clima fresco de montaña en San Rafael, Barva y cafetales tradicionales.' },
  { name: 'Cartago', slug: 'cartago', count: 75, image: '/regions/cartago.png', desc: 'Montañas neblinosas, paz agrícola y vistas al hermoso Valle de Orosi.' },
  { name: 'Guanacaste', slug: 'guanacaste', count: 110, image: '/regions/guanacaste.png', desc: 'Villas costeras premium en Conchal, Flamingo, Tamarindo y el Golfo.' },
  { name: 'Puntarenas', slug: 'puntarenas', count: 68, image: '/regions/puntarenas.png', desc: 'El mar tocando la selva tropical en Manuel Antonio y nubes en Monteverde.' },
  { name: 'Limón', slug: 'limon', count: 43, image: '/regions/limon.png', desc: 'Brisa caribeña tranquila y playas vírgenes en Cahuita, Cocles y Punta Uva.' },
];

export default async function Home() {
  const lang = await getServerLanguage();
  const t = getTranslations(lang);

  // Run all data fetching in parallel for maximum speed
  const [featuredResult, ...countResults] = await Promise.all([
    getRandomFeaturedPropertiesAction(undefined, 3),
    // Sales counts (0-6)
    ...PROVINCES.map((prov) =>
      process.env.DATABASE_URL
        ? db.property.count({ where: { province: prov.name, status: 'active', type: 'buy' } }).catch(() => 0)
        : Promise.resolve(0)
    ),
    // Rental counts (7-13)
    ...PROVINCES.map((prov) =>
      process.env.DATABASE_URL
        ? db.property.count({ where: { province: prov.name, status: 'active', type: 'rent' } }).catch(() => 0)
        : Promise.resolve(0)
    ),
  ]);

  const featuredItems = featuredResult.items;
  const featuredTotal = featuredResult.totalCount;
  
  const provinceCounts = PROVINCES.map((prov, i) => {
    const buyCount = countResults[i] as number;
    const rentCount = countResults[i + 7] as number;
    return {
      ...prov,
      buyCount,
      rentCount,
      totalCount: buyCount + rentCount,
    };
  });

  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://ticohabitat.com/#website',
        'url': 'https://ticohabitat.com',
        'name': 'TicoHabitat',
        'description': lang === 'en' 
          ? 'Costa Rica\'s fastest and most reliable real estate platform. Find and publish houses, apartments and lots with no spam or duplicates.'
          : 'La plataforma inmobiliaria más rápida y confiable de Costa Rica. Encuentra y publica casas, apartamentos y lotes sin spam ni duplicados.',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': 'https://ticohabitat.com/comprar?search={search_term_string}'
          },
          'query-input': 'required name=search_term_string'
        },
        'inLanguage': lang
      },
      {
        '@type': 'Organization',
        '@id': 'https://ticohabitat.com/#organization',
        'name': 'TicoHabitat',
        'url': 'https://ticohabitat.com',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://ticohabitat.com/logo-vertical.png',
          'width': '512',
          'height': '512'
        },
        'description': lang === 'en'
          ? 'Platform to find houses, apartments, lots and country estates for rent and sale in Costa Rica. Direct contact, SMS/OTP cell phone verification and real control against duplicate listings.'
          : 'Plataforma para encontrar casas, apartamentos, lotes y quintas en alquiler y venta en Costa Rica. Trato directo, verificación OTP celular y control real contra anuncios duplicados.',
        'sameAs': [
          'https://facebook.com/ticohabitat',
          'https://instagram.com/ticohabitat'
        ]
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50/20 dark:bg-stone-950/20 transition-colors duration-150">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      {/* 1. HERO SECTION - Premium, Breathable, Nature-Integrated Editorial Layout */}
      <section className="relative py-32 lg:py-44 border-b border-stone-250/30 dark:border-stone-900/80 hero-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-10">
          
          {/* Subtle National Focus Badge (Forest / Sage Green indicator) */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-1.5 text-[10px] font-black text-emerald-800 dark:text-emerald-450 border border-emerald-200/40 dark:border-emerald-900/30 mx-auto uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-450 animate-pulse" />
            <span>{t.home.heroBadge}</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-7xl font-extrabold tracking-tight text-stone-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-[1.08]">
            {t.home.heroTitlePart1}<span className="text-primary italic font-medium font-serif font-light text-emerald-900 dark:text-sky-350">{t.home.heroTitleItalic}</span>
          </h1>
          
          <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed font-semibold">
            {t.home.heroSubtitle}
          </p>

          {/* GIGANTIC MINIMALIST CTAS - Airbnb/Apple Style */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4.5 max-w-lg mx-auto pt-6">
            <Link
              href="/comprar"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-200 py-4.5 px-7 text-sm font-black text-white dark:text-stone-950 shadow transition-all active:scale-[0.98]"
            >
              <Compass className="h-4.5 w-4.5" />
              <span>{t.common.viewPropertiesInSale}</span>
            </Link>
            
            <Link
              href="/alquilar"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-primary hover:bg-primary-hover py-4.5 px-7 text-sm font-black text-white shadow transition-all active:scale-[0.98]"
            >
              <Building className="h-4.5 w-4.5" />
              <span>{t.common.exploreActiveRentals}</span>
            </Link>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-14 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-550">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
              <span>{t.home.otpBadge}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Award className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
              <span>{t.home.spamBadge}</span>
            </div>
            <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
              <span>{t.home.whatsappBadge}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED PROPERTIES - Democratic rotating carousel */}
      <section className="py-28 bg-white dark:bg-stone-900 transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
          {featuredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-16 bg-card-bg border border-card-border rounded-2xl shadow-sm">
              <Compass className="h-10 w-10 text-stone-350 dark:text-stone-600 mb-3.5 animate-pulse" />
              <h3 className="font-display font-extrabold text-lg text-stone-850 dark:text-stone-200">{t.home.emptyFeaturedTitle}</h3>
              <p className="text-xs text-stone-450 dark:text-stone-400 mt-1 mb-6 font-semibold">{t.home.emptyFeaturedDesc}</p>
              <Link href="/publicar" className="btn-primary py-3 px-6 text-xs transition-all shadow shadow-sm active:scale-95">
                {t.home.emptyFeaturedBtn}
              </Link>
            </div>
          ) : (
            <FeaturedCarousel
              initialItems={featuredItems}
              totalCount={featuredTotal}
              title={t.home.featuredTitle}
              badge={t.home.featuredBadge}
            />
          )}
        </div>
      </section>

      {/* 3. PROVINCES GRID - Airbnb-like clean cards */}
      <section className="py-28 border-t border-stone-200/40 dark:border-stone-900 bg-stone-50/10 dark:bg-background transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center md:text-left space-y-2">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              {t.home.provincesTitle}
            </h2>
            <p className="text-sm font-semibold text-stone-450 mt-2 max-w-2xl leading-relaxed">
              {t.home.provincesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {provinceCounts.map((prov) => {
              const provinceDesc = t.home.provinceDesc[prov.slug as keyof typeof t.home.provinceDesc] || prov.desc;
              const adsText = prov.totalCount === 1
                ? t.common.adCount.replace('{count}', '1')
                : t.common.adsCount.replace('{count}', String(prov.totalCount));
              return (
                <div
                  key={prov.slug}
                  className="group flex flex-col overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  {/* Image Link (Defaults to sales/comprar view) */}
                  <Link
                    href={`/comprar/${prov.slug}`}
                    className="relative aspect-[16/11] overflow-hidden bg-stone-100 dark:bg-stone-900 border-b border-card-border block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prov.image}
                      alt={prov.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-stone-900/10 to-transparent opacity-40 dark:opacity-60" />
                    <span className="absolute bottom-3 left-3 bg-stone-900/75 dark:bg-stone-950/75 backdrop-blur-xs text-[9px] font-black text-white px-2.5 py-1 rounded uppercase tracking-wider">
                      {adsText}
                    </span>
                  </Link>

                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <h3 className="font-display font-black text-base text-stone-850 dark:text-stone-100">
                        {prov.name}
                      </h3>
                      <p className="text-xs text-stone-450 dark:text-stone-400 leading-relaxed font-semibold">
                        {provinceDesc}
                      </p>
                    </div>

                    {/* Two separate dynamic CTA buttons at the bottom */}
                    <div className="pt-3.5 border-t border-stone-100 dark:border-stone-850/30 grid grid-cols-2 gap-2">
                      <Link
                        href={`/comprar/${prov.slug}`}
                        className="flex flex-col items-center justify-center py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-850 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-150 transition-colors"
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">{t.common.buy}</span>
                        <span className="text-[8px] font-bold text-stone-450 dark:text-stone-550 mt-0.5">
                          {prov.buyCount === 1 ? t.common.adCount.replace('{count}', '1') : t.common.adsCount.replace('{count}', String(prov.buyCount))}
                        </span>
                      </Link>

                      <Link
                        href={`/alquilar/${prov.slug}`}
                        className="flex flex-col items-center justify-center py-2.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 dark:text-emerald-450 transition-colors border border-emerald-500/10"
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider">{t.common.rent}</span>
                        <span className="text-[8px] font-bold text-emerald-700/80 dark:text-emerald-450/80 mt-0.5">
                          {prov.rentCount === 1 ? t.common.adCount.replace('{count}', '1') : t.common.adsCount.replace('{count}', String(prov.rentCount))}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
