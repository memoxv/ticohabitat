import React from 'react';
import Link from 'next/link';
import { getProperties, getRandomFeaturedPropertiesAction } from '@/lib/properties';
import FeaturedCarousel from '@/components/FeaturedCarousel';
import { Compass, Award, ShieldCheck, MessageSquare, Building } from 'lucide-react';
import { db } from '@/lib/db';

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
  // Run all data fetching in parallel for maximum speed
  const [featuredResult, ...countResults] = await Promise.all([
    getRandomFeaturedPropertiesAction(undefined, 3),
    ...PROVINCES.map((prov) =>
      process.env.DATABASE_URL
        ? db.property.count({ where: { province: prov.name, status: 'active' } }).catch(() => 0)
        : Promise.resolve(0)
    ),
  ]);

  const featuredItems = featuredResult.items;
  const featuredTotal = featuredResult.totalCount;
  const provinceCounts = PROVINCES.map((prov, i) => ({ ...prov, count: countResults[i] as number }));

  return (
    <div className="flex flex-col min-h-screen bg-stone-50/20 dark:bg-stone-950/20 transition-colors duration-150">
      
      {/* 1. HERO SECTION - Premium, Breathable, Nature-Integrated Editorial Layout */}
      <section className="relative py-32 lg:py-44 border-b border-stone-250/30 dark:border-stone-900/80 hero-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-10">
          
          {/* Subtle National Focus Badge (Forest / Sage Green indicator) */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-1.5 text-[10px] font-black text-emerald-800 dark:text-emerald-450 border border-emerald-200/40 dark:border-emerald-900/30 mx-auto uppercase tracking-widest">
            <span className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-450 animate-pulse" />
            <span>Un estilo de vida natural en Costa Rica</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-7xl font-extrabold tracking-tight text-stone-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-[1.08]">
            Encontrá un lugar para vivir con <span className="text-primary italic font-medium font-serif font-light text-emerald-900 dark:text-sky-350">tranquilidad</span>
          </h1>
          
          <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed font-semibold">
            Casas, apartamentos y lotes seleccionados para quienes buscan bienestar, calma y un mejor estilo de vida. Anuncios verificados directamente con sus propietarios.
          </p>

          {/* GIGANTIC MINIMALIST CTAS - Airbnb/Apple Style */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4.5 max-w-lg mx-auto pt-6">
            <Link
              href="/comprar"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-stone-950 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-200 py-4.5 px-7 text-sm font-black text-white dark:text-stone-950 shadow transition-all active:scale-[0.98]"
            >
              <Compass className="h-4.5 w-4.5" />
              <span>Ver propiedades en venta</span>
            </Link>
            
            <Link
              href="/alquilar"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-primary hover:bg-primary-hover py-4.5 px-7 text-sm font-black text-white shadow transition-all active:scale-[0.98]"
            >
              <Building className="h-4.5 w-4.5" />
              <span>Explorar alquileres activos</span>
            </Link>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-14 text-[10px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-550">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
              <span>OTP obligatorio</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Award className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
              <span>Control contra spam</span>
            </div>
            <div className="col-span-2 md:col-span-1 flex items-center justify-center gap-2">
              <MessageSquare className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
              <span>WhatsApp directo</span>
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
              <h3 className="font-display font-extrabold text-lg text-stone-800 dark:text-stone-200">Aún estamos preparando las llaves de tu próximo hogar</h3>
              <p className="text-xs text-stone-450 dark:text-stone-400 mt-1 mb-6 font-semibold">Sé el primero en publicar una propiedad de forma segura y verificada con OTP.</p>
              <Link href="/publicar" className="btn-primary py-3 px-6 text-xs transition-all shadow shadow-sm active:scale-95">
                Comenzar a Publicar
              </Link>
            </div>
          ) : (
            <FeaturedCarousel
              initialItems={featuredItems}
              totalCount={featuredTotal}
              title="Hogares destacados para vivir mejor"
              badge="Destacados Premium"
            />
          )}
        </div>
      </section>

      {/* 3. PROVINCES GRID - Airbnb-like clean cards */}
      <section className="py-28 border-t border-stone-200/40 dark:border-stone-900 bg-stone-50/10 dark:bg-background transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
          <div className="text-center md:text-left space-y-2">
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight">
              Explorá por región y descubrí tu próximo entorno
            </h2>
            <p className="text-sm font-semibold text-stone-450 mt-2 max-w-2xl leading-relaxed">
              Encontrá el espacio perfecto para tu estilo de vida en las zonas más acogedoras del país.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {provinceCounts.map((prov) => (
              <Link
                key={prov.slug}
                href={`/comprar/${prov.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-card-border bg-card-bg hover:bg-card-bg hover-lift shadow-sm transition-all duration-300"
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
                    {prov.count} anuncios
                  </span>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-display font-black text-base text-stone-850 dark:text-stone-100 group-hover:text-primary transition-colors">
                      {prov.name}
                    </h3>
                    <p className="text-xs text-stone-450 dark:text-stone-400 leading-relaxed font-semibold">
                      {prov.desc}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-stone-100 dark:border-stone-850/30 flex items-center justify-between">
                    <span className="text-[10px] font-black text-stone-450 group-hover:text-primary uppercase tracking-widest transition-colors">
                      Explorar región
                    </span>
                    <span className="text-sm font-black text-primary transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
