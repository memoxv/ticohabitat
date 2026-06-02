import React from 'react';
import Link from 'next/link';
import { getPropertyBySlug, getSimilarProperties, trackMetric } from '@/lib/properties';
import PropertyCard from '@/components/PropertyCard';
import PropertyDetailsClient from '@/components/PropertyDetailsClient';
import PropertyGallery from '@/components/PropertyGallery';
import { resolveFeatures, FEATURE_CATEGORIES } from '@/lib/attributes';
import {
  BedDouble,
  Bath,
  Car,
  Maximize,
  PawPrint,
  Armchair,
  Building,
  CheckCircle2,
  Award,
  ChevronLeft,
  Calendar,
} from 'lucide-react';

export const revalidate = 0; // Fresh details always

interface PropertyDetailsPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const property = await getPropertyBySlug(resolvedParams.slug);
  if (!property) {
    return {
      title: 'Propiedad no encontrada | TicoHabitat',
    };
  }

  const imageUrl = property.images?.[0]?.url || 'https://ticohabitat.com/default-brand-cover.jpg';
  const url = `https://ticohabitat.com/propiedad/${resolvedParams.slug}`;

  return {
    title: `${property.title} | TicoHabitat`,
    description: property.description.substring(0, 155) + '...',
    alternates: {
      canonical: `/propiedad/${resolvedParams.slug}`,
    },
    openGraph: {
      title: `${property.title} | TicoHabitat`,
      description: property.description.substring(0, 155) + '...',
      url,
      siteName: 'TicoHabitat',
      locale: 'es_CR',
      type: 'article',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: property.title,
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${property.title} | TicoHabitat`,
      description: property.description.substring(0, 155) + '...',
      images: [imageUrl],
    }
  };
}

export default async function PropertyDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const property = await getPropertyBySlug(resolvedParams.slug);

  if (!property) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 text-center bg-stone-50/20 dark:bg-stone-950/20">
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">Propiedad no encontrada</h1>
        <p className="text-stone-500 mt-2 mb-6">El anuncio que buscas no existe o ha sido retirado por su propietario.</p>
        <Link href="/" className="bg-stone-950 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-bold px-6 py-3 rounded-lg shadow-sm transition-colors">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  // Fetch similar properties and track metric in parallel to improve load speed by 2x
  const [similar] = await Promise.all([
    getSimilarProperties(property),
    trackMetric('view', property.id),
  ]);

  const formattedPrice = property.currency === 'CRC'
    ? `₡${property.price.toLocaleString('es-CR')}`
    : `$${property.price.toLocaleString('en-US')}`;

  const typeLabel = property.type === 'buy' ? 'Venta' : 'Alquiler';
  const propertyTypeLabel = (({
    house: 'Casa',
    apartment: 'Apartamento',
    lot: 'Lote / Terreno',
    commercial: 'Local Comercial',
    other: 'Propiedad',
  } as Record<string, string>)[property.propertyType] || 'Propiedad');

  // Parse and resolve contextual features
  let featureKeys: string[] = [];
  try {
    featureKeys = JSON.parse(property.features || '[]');
  } catch (e) {
    featureKeys = [];
  }

  // Fallback to legacy features for old data if features array is empty
  if (featureKeys.length === 0) {
    if (property.petsAllowed) featureKeys.push('permite_mascotas');
    if (property.furnished) featureKeys.push('amueblado');
    if (property.condominium) featureKeys.push('en_condominio');
  }

  const resolved = resolveFeatures(property.propertyType, featureKeys);

  // Group resolved features by category
  const categorizedFeatures: Record<string, typeof resolved> = {};
  resolved.forEach((feat) => {
    const cat = feat.category;
    if (!categorizedFeatures[cat]) {
      categorizedFeatures[cat] = [];
    }
    categorizedFeatures[cat].push(feat);
  });

  // Map internal property type to Schema.org types
  const schemaType = (({
    house: 'SingleFamilyResidence',
    apartment: 'Apartment',
    lot: 'Landform',
    commercial: 'CommercialProperties',
    other: 'Place',
  } as Record<string, string>)[property.propertyType] || 'Place');

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: property.title,
    description: property.description.substring(0, 160) + '...',
    url: `https://ticohabitat.com/propiedad/${property.slug}`,
    image: property.images.map((img: any) => img.url),
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.canton || property.district || '',
      addressRegion: property.province,
      addressCountry: 'CR',
    },
    numberOfRooms: (property.bedrooms || 0) + (property.bathrooms || 0),
    numberOfBedrooms: property.bedrooms || 0,
    numberOfBathroomsTotal: property.bathrooms || 0,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: property.areaM2,
      unitCode: 'MTK', // Square meters
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: property.currency,
      priceValidUntil: '2027-12-31',
      url: `https://ticohabitat.com/propiedad/${property.slug}`,
      availability: 'https://schema.org/InStock',
      validFrom: property.createdAt.toISOString().split('T')[0],
    },
  };

  const specItems = [];
  if (property.propertyType !== 'lot' && property.propertyType !== 'commercial' && property.bedrooms > 0) {
    specItems.push({
      icon: <BedDouble className="h-5.5 w-5.5" />,
      value: property.bedrooms,
      label: property.bedrooms === 1 ? 'Habitación' : 'Habitaciones'
    });
  }
  if (property.propertyType !== 'lot') {
    if (property.bathrooms > 0) {
      specItems.push({
        icon: <Bath className="h-5.5 w-5.5" />,
        value: property.bathrooms,
        label: property.bathrooms === 1 ? 'Baño' : 'Baños'
      });
    }
    if (property.parkingSpaces > 0) {
      specItems.push({
        icon: <Car className="h-5.5 w-5.5" />,
        value: property.parkingSpaces,
        label: property.parkingSpaces === 1 ? 'Parqueo' : 'Parqueos'
      });
    }
  }
  specItems.push({
    icon: <Maximize className="h-5.5 w-5.5" />,
    value: property.areaM2,
    label: 'm² Área'
  });

  return (
    <div className="flex-grow bg-stone-50/10 dark:bg-stone-950/10 pb-20">
      {/* Dynamic SEO Structural Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      
      {/* 1. TOP NAV / BREADCRUMB */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href={`/${property.type === 'buy' ? 'comprar' : 'alquilar'}/${property.province.toLowerCase().replace(/ /g, '-')}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-450 hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            <span>Volver a {property.province}</span>
          </Link>

          <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            <Link href="/" className="hover:text-primary">Inicio</Link>
            <span>/</span>
            <Link href={`/${property.type === 'buy' ? 'comprar' : 'alquilar'}`}>{typeLabel}</Link>
            <span>/</span>
            <span className="text-stone-600 dark:text-stone-300 line-clamp-1 max-w-[200px] normal-case">{property.title}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN DETAILS */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-10">
            
            {/* Image Gallery Container - Editorial clean design */}
            <PropertyGallery
              images={property.images.map((img: any) => img.url)}
              title={property.title}
              type={property.type}
              featured={property.featured}
              verified={property.verified}
              contactPhone={property.contactPhone}
            />

            {/* Title & Core Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold bg-stone-100 dark:bg-stone-850 text-stone-500 px-3 py-1.5 rounded-md uppercase tracking-wider border border-stone-200/40 dark:border-stone-800">
                  {propertyTypeLabel}
                </span>
                <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Publicado el {property.createdAt.toLocaleDateString('es-CR')}</span>
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white leading-tight tracking-tight">
                {property.title}
              </h1>

              <p className="text-sm font-bold text-stone-450 flex items-center gap-1">
                <span>{property.province}</span>
                {property.canton && <span>• {property.canton}</span>}
                {property.district && <span>• {property.district}</span>}
              </p>
            </div>

            {/* Physical Specs Grid - Elegant minimal lines instead of bloated boxes */}
            <div className={`grid ${
              specItems.length === 4 
                ? 'grid-cols-2 sm:grid-cols-4' 
                : specItems.length === 3 
                  ? 'grid-cols-3' 
                  : 'grid-cols-1'
            } gap-6 p-6 rounded-2xl border border-stone-200/50 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-sm text-center`}>
              {specItems.map((item, idx) => (
                <div key={idx} className={`space-y-1${idx > 0 ? ' border-l border-stone-100 dark:border-stone-800' : ''}`}>
                  <div className="flex justify-center text-primary">{item.icon}</div>
                  <div className="text-xl font-black text-stone-900 dark:text-white font-mono tracking-tight">{item.value}</div>
                  <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-4 pt-4">
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white tracking-tight">Descripción de la Propiedad</h2>
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line text-sm md:text-base font-medium">
                {property.description}
              </p>
            </div>

            {/* Contextual & Categorized Features Grid */}
            <div className="space-y-6 pt-8 border-t border-stone-200/60 dark:border-stone-850">
              <div>
                <h2 className="font-display text-xl font-bold text-stone-900 dark:text-white tracking-tight">
                  Características & Amenidades
                </h2>
                <p className="text-xs font-bold text-stone-400 mt-1">
                  Especificaciones detalladas de esta propiedad.
                </p>
              </div>

              {resolved.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(categorizedFeatures).map(([catKey, feats]) => (
                    <div
                      key={catKey}
                      className="p-6 rounded-2xl border border-stone-200/60 dark:border-stone-850 bg-stone-50/20 dark:bg-stone-900/10 hover:bg-white dark:hover:bg-card-bg hover:border-primary/20 dark:hover:border-primary/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] space-y-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    >
                      <h3 className="font-display text-xs font-black text-primary dark:text-primary uppercase tracking-widest">
                        {FEATURE_CATEGORIES[catKey] || catKey}
                      </h3>
                      <ul className="grid grid-cols-1 gap-2.5">
                        {feats.map((feat) => (
                          <li
                            key={feat.key}
                            className="flex items-start gap-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors"
                          >
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium text-stone-400 italic">
                  No se especificaron características adicionales para esta propiedad.
                </p>
              )}
            </div>
          </div>

          {/* Sticky Sidebar Action Column - Elegant Double-Bezel (Doppelrand) Enclosure */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-[2rem] border border-stone-200/50 dark:border-stone-850/60 bg-stone-50/50 dark:bg-stone-900/30 p-2 shadow-sm">
              <div className="bg-white dark:bg-stone-900 rounded-[1.375rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] p-6 space-y-6 border border-stone-100 dark:border-stone-800">
                
                {/* Price Box */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Precio de {typeLabel}</span>
                  <div className="text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight font-display">{formattedPrice}</div>
                  {property.type === 'rent' && <span className="text-[10px] font-bold text-stone-400">por mes (CRC/USD según contrato)</span>}
                </div>

                <hr className="border-stone-100 dark:border-stone-800" />

                {/* Client Component Actions: WhatsApp, Favorites, Report, Anunciante info */}
                <PropertyDetailsClient
                  property={{
                    id: property.id,
                    title: property.title,
                    slug: property.slug,
                    type: property.type,
                    propertyType: property.propertyType,
                    price: property.price,
                    currency: property.currency,
                    province: property.province,
                    canton: property.canton,
                    district: property.district,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    parkingSpaces: property.parkingSpaces,
                    areaM2: property.areaM2,
                    petsAllowed: property.petsAllowed,
                    furnished: property.furnished,
                    condominium: property.condominium,
                    contactPhone: property.contactPhone,
                    whatsapp: property.whatsapp,
                    user: {
                      name: property.user.name,
                      email: property.user.email,
                      planType: property.user.planType,
                      agencyName: property.user.agencyName,
                      agencyLogo: property.user.agencyLogo,
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. SIMILAR SUGGESTIONS */}
        {similar.length > 0 && (
          <div className="mt-20 border-t border-stone-200/60 dark:border-stone-800/80 pt-12 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Propiedades Similares</h2>
              <p className="text-xs font-bold text-stone-450 mt-1">Otras excelentes opciones disponibles en {property.province} que podrían interesarle.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {similar.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={{
                    id: prop.id,
                    type: prop.type,
                    propertyType: prop.propertyType,
                    title: prop.title,
                    slug: prop.slug,
                    price: prop.price,
                    currency: prop.currency,
                    province: prop.province,
                    canton: prop.canton,
                    bedrooms: prop.bedrooms,
                    bathrooms: prop.bathrooms,
                    parkingSpaces: prop.parkingSpaces,
                    petsAllowed: prop.petsAllowed,
                    featured: prop.featured,
                    verified: prop.verified,
                    imageUrl: prop.images?.[0]?.url,
                    contactPhone: prop.contactPhone,
                    whatsapp: prop.whatsapp,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
