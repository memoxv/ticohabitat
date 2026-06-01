import React from 'react';
import Link from 'next/link';
import { getProperties } from '@/lib/properties';
import PropertySearchPage from '@/components/PropertySearchPage';

export const revalidate = 0; // Dynamic server rendering for fresh results

const PROVINCE_MAP: Record<string, string> = {
  'san-jose': 'San José',
  'alajuela': 'Alajuela',
  'heredia': 'Heredia',
  'cartago': 'Cartago',
  'guanacaste': 'Guanacaste',
  'puntarenas': 'Puntarenas',
  'limon': 'Limón',
};

interface PageProps {
  params: {
    provincia: string;
  };
  searchParams: {
    propertyType?: string;
    priceMax?: string;
    bedrooms?: string;
    bathrooms?: string;
    parking?: string;
    pets?: string;
    condo?: string;
    search?: string;
    sort?: string;
  };
}

export async function generateMetadata({ params }: { params: Promise<{ provincia: string }> }) {
  const resolvedParams = await params;
  const province = PROVINCE_MAP[resolvedParams.provincia] || 'Costa Rica';
  const url = `https://ticohabitat.com/comprar/${resolvedParams.provincia}`;

  return {
    title: `Propiedades en Venta en ${province} | TicoHabitat`,
    description: `Encuentre casas, apartamentos y lotes en venta en ${province}, Costa Rica. Filtrado rápido, libre de spam y verificado por OTP.`,
    alternates: {
      canonical: `/comprar/${resolvedParams.provincia}`,
    },
    openGraph: {
      title: `Propiedades en Venta en ${province} | TicoHabitat`,
      description: `Encuentre casas, apartamentos y lotes en venta en ${province}, Costa Rica. Filtrado rápido, libre de spam y verificado por OTP.`,
      url,
      siteName: 'TicoHabitat',
      locale: 'es_CR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Propiedades en Venta en ${province} | TicoHabitat`,
      description: `Encuentre casas, apartamentos y lotes en venta en ${province}, Costa Rica. Filtrado rápido, libre de spam y verificado por OTP.`,
    }
  };
}

export default async function ComprarProvinciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ provincia: string }>;
  searchParams: Promise<{
    propertyType?: string;
    priceMax?: string;
    bedrooms?: string;
    bathrooms?: string;
    parking?: string;
    pets?: string;
    condo?: string;
    search?: string;
    sort?: string;
    features?: string;
  }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const provinceSlug = resolvedParams.provincia;
  const provinceName = PROVINCE_MAP[provinceSlug];

  if (!provinceName) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
        <h1 className="text-2xl font-bold text-red-500">Provincia no válida</h1>
        <p className="text-slate-500 mt-1 mb-4">La provincia solicitada no pertenece a Costa Rica.</p>
        <Link href="/comprar" className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-semibold shadow">
          Volver a Selección
        </Link>
      </div>
    );
  }

  // Parse filters from searchParams
  const propertyType = resolvedSearchParams.propertyType;
  const priceMax = resolvedSearchParams.priceMax ? parseFloat(resolvedSearchParams.priceMax) : undefined;
  const bedrooms = resolvedSearchParams.bedrooms ? parseInt(resolvedSearchParams.bedrooms) : undefined;
  const bathrooms = resolvedSearchParams.bathrooms ? parseInt(resolvedSearchParams.bathrooms) : undefined;
  const parkingSpaces = resolvedSearchParams.parking ? parseInt(resolvedSearchParams.parking) : undefined;
  const petsAllowed = resolvedSearchParams.pets === 'true';
  const condominium = resolvedSearchParams.condo === 'true';
  const search = resolvedSearchParams.search;
  const sort = resolvedSearchParams.sort as any;
  const features = resolvedSearchParams.features;

  // Query database using the properties service
  const propertiesData = await getProperties({
    type: 'buy',
    province: provinceName,
    propertyType,
    priceMax,
    bedrooms,
    bathrooms,
    parkingSpaces,
    petsAllowed,
    condominium,
    search,
    sort,
    features,
    limit: 50, // High limit for MVP listing
  });

  return (
    <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Link href="/" className="hover:text-primary transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/comprar" className="hover:text-primary transition-colors">Comprar</Link>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-350">{provinceName}</span>
        </div>
      </div>

      <PropertySearchPage
        type="buy"
        provinceName={provinceName}
        initialItems={propertiesData.items}
      />
    </div>
  );
}
