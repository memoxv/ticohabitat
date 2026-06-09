import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { getRandomFeaturedPropertiesAction } from '@/lib/properties';
import { db } from '@/lib/db';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { getTranslations } from '@/lib/translations';
import { getServerLanguage } from '@/lib/serverTranslations';

export const revalidate = 0; // Fresh content always

export const metadata: Metadata = {
  title: 'Alquiler de Propiedades en Costa Rica | TicoHabitat',
  description: 'Descubra casas, apartamentos, cuartos y locales en alquiler en Costa Rica. Trato directo, verificación OTP contra spam y entorno 100% confiable.',
  alternates: {
    canonical: '/alquilar',
  },
  openGraph: {
    title: 'Alquiler de Propiedades en Costa Rica | TicoHabitat',
    description: 'Descubra casas, apartamentos, cuartos y locales en alquiler en Costa Rica. Trato directo, verificación OTP contra spam y entorno 100% confiable.',
    url: 'https://www.ticohabitat.com/alquilar',
    siteName: 'TicoHabitat',
    locale: 'es_CR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alquiler de Propiedades en Costa Rica | TicoHabitat',
    description: 'Descubra casas, apartamentos, cuartos y locales en alquiler en Costa Rica. Trato directo, verificación OTP contra spam y entorno 100% confiable.',
  }
};

const PROVINCES = [
  { name: 'San José', slug: 'san-jose', image: '/regions/sanjose.png', desc: 'Apartamentos céntricos, estudios modernos y casas residenciales en el corazón del Valle Central.' },
  { name: 'Alajuela', slug: 'alajuela', image: '/regions/alajuela.png', desc: 'Casas amplias con jardín, clima cálido y cercanía al aeropuerto y zonas industriales.' },
  { name: 'Heredia', slug: 'heredia', image: '/regions/heredia.png', desc: 'Apartamentos frescos cerca de zonas francas, universidades y cafetales de montaña.' },
  { name: 'Cartago', slug: 'cartago', image: '/regions/cartago.png', desc: 'Alquileres accesibles en clima de montaña, valles tranquilos y comunidades tradicionales.' },
  { name: 'Guanacaste', slug: 'guanacaste', image: '/regions/guanacaste.png', desc: 'Villas vacacionales, apartamentos cerca de la playa y opciones de vida costera premium.' },
  { name: 'Puntarenas', slug: 'puntarenas', image: '/regions/puntarenas.png', desc: 'Casas frente al mar, cabinas turísticas y espacios rodeados de selva tropical.' },
  { name: 'Limón', slug: 'limon', image: '/regions/limon.png', desc: 'Alquileres caribeños, casas con brisa marina y entornos naturales de biodiversidad única.' },
];

export default async function AlquilarIndex() {
  const lang = await getServerLanguage();
  const t = getTranslations(lang);

  // Run all data fetching in parallel for maximum speed
  const [featuredResult, ...countResults] = await Promise.all([
    getRandomFeaturedPropertiesAction('rent', 3).catch(() => ({ items: [], totalCount: 0 })),
    ...PROVINCES.map((prov) =>
      process.env.DATABASE_URL
        ? db.property.count({ where: { province: prov.name, status: 'active', type: 'rent' } }).catch(() => 0)
        : Promise.resolve(0)
    ),
  ]);

  const featuredItems = featuredResult.items as any[];
  const featuredTotal = featuredResult.totalCount;
  const provinceCounts = PROVINCES.map((prov, i) => ({ ...prov, count: countResults[i] as number }));

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': lang === 'en' ? 'Properties for Rent in Costa Rica | TicoHabitat' : 'Alquiler de Propiedades en Costa Rica | TicoHabitat',
    'description': lang === 'en'
      ? 'Find houses, apartments, spaces and commercial properties for rent in Costa Rica. Direct contact, no commissions.'
      : 'Descubra casas, apartamentos, cuartos y locales en alquiler en Costa Rica. Trato directo con el propietario sin intermediarios.',
    'url': 'https://www.ticohabitat.com/alquilar',
    'about': {
      '@type': 'Place',
      'name': 'Costa Rica'
    }
  };

  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-stone-400 dark:text-stone-500 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">{t.common.home}</Link>
          <span>/</span>
          <span className="text-stone-600 dark:text-stone-300">{t.common.rent}</span>
        </div>

        {/* Title & Copy */}
        <div className="text-left mb-16 max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight">
            {lang === 'en' ? 'In which province do you want to ' : '¿En cuál provincia desea '}<span className="text-primary">{lang === 'en' ? 'rent' : 'alquilar'}</span>{lang === 'en' ? ' your space?' : ' su espacio?'}
          </h1>
          <p className="text-sm font-medium text-stone-500 dark:text-stone-400 mt-4 leading-relaxed">
            {t.alquilar.subtitle}
          </p>
        </div>

        {/* Featured Showcase - Renting Carousel */}
        {featuredItems.length > 0 ? (
          <div className="mb-16">
            <FeaturedCarousel
              initialItems={featuredItems}
              totalCount={featuredTotal}
              typeFilter="rent"
              title={t.alquilar.featuredTitle}
              badge={t.alquilar.featuredBadge}
            />
          </div>
        ) : (
          /* Promotional CTA Placeholder */
          <div className="mb-16 p-8 rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-amber-500/0 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-450 bg-amber-500/10 dark:bg-amber-500/5 px-2.5 py-1 rounded-md">
                <Sparkles className="h-3.5 w-3.5 fill-amber-600 dark:fill-amber-450 text-amber-600 dark:text-amber-450 shrink-0" />
                <span>{lang === 'en' ? 'Featured Space' : 'Espacio Destacado'}</span>
              </span>
              <h3 className="font-display font-extrabold text-lg text-stone-900 dark:text-white">
                {t.alquilar.promoTitle}
              </h3>
              <p className="text-xs text-stone-550 dark:text-stone-400 max-w-xl leading-relaxed">
                {t.alquilar.promoDesc}
              </p>
            </div>
            <Link 
              href="/publicar" 
              className="py-3 px-6 text-xs text-center shrink-0 shadow-md hover-lift transition-all bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-xl border border-amber-300 active:scale-[0.985]"
            >
              {t.alquilar.promoBtn}
            </Link>
          </div>
        )}

        {/* Provinces Grid - Premium image cards matching homepage style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {provinceCounts.map((prov) => {
            const provinceDesc = t.home.provinceDesc[prov.slug as keyof typeof t.home.provinceDesc] || prov.desc;
            const listingsText = prov.count === 1
              ? t.common.adCount.replace('{count}', '1')
              : t.common.adsCount.replace('{count}', String(prov.count));
            return (
              <Link
                key={prov.slug}
                href={`/alquilar/${prov.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-card-border bg-card-bg hover-lift shadow-sm transition-all duration-300"
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-stone-100 dark:bg-stone-900 border-b border-card-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prov.image}
                    alt={prov.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/50 via-stone-900/10 to-transparent opacity-40 dark:opacity-60" />
                  <span className="absolute bottom-3 left-3 bg-stone-900/70 dark:bg-stone-950/70 backdrop-blur-xs text-[9px] font-black text-white px-2 py-0.5 rounded uppercase tracking-wider">
                    {listingsText}
                  </span>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-display font-black text-base text-stone-850 dark:text-stone-100 group-hover:text-primary transition-colors">
                      {prov.name}
                    </h3>
                    <p className="text-xs text-stone-450 dark:text-stone-400 leading-relaxed font-semibold">
                      {provinceDesc}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-stone-100 dark:border-stone-850/30 flex items-center justify-between">
                    <span className="text-[10px] font-black text-stone-450 group-hover:text-primary uppercase tracking-widest transition-colors">
                      {t.common.exploreRegion}
                    </span>
                    <span className="text-sm font-black text-primary transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
