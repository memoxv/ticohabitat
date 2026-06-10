import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import DestacarClient from '@/components/DestacarClient';
import { getPropertyFeaturedStatus } from '@/app/actions/monetization';

interface DestacarPageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export default async function DestacarPage({ params }: DestacarPageProps) {
  const session = await getSession();
  const { locale, id } = await params;

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Query property details
  const property = await db.property.findUnique({
    where: { id },
    include: {
      images: {
        take: 1,
      },
    },
  });

  if (!property) {
    redirect(`/${locale}/dashboard`);
  }

  // Defensive: Ensure ownership
  if (property.userId !== session.userId && session.role !== 'ADMIN') {
    redirect(`/${locale}/dashboard`);
  }

  // Check if a pending transaction already exists
  const pendingTx = await db.transaction.findFirst({
    where: {
      referenceId: id,
      type: 'featured_listing',
      status: 'pending',
    },
  });

  // Fetch enriched highlight status and quota details
  const statusDetails = await getPropertyFeaturedStatus(id);

  return (
    <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/10 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <span>{locale === 'en' ? 'Home' : 'Inicio'}</span>
          <span>/</span>
          <span>{locale === 'en' ? 'My Panel' : 'Mi Panel'}</span>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-350">
            {locale === 'en' ? 'Highlight Property' : 'Destacar Propiedad'}
          </span>
        </div>

        <DestacarClient
          property={{
            id: property.id,
            title: property.title,
            price: property.price,
            currency: property.currency,
            province: property.province,
            imageUrl: property.images?.[0]?.url || null,
            featured: property.featured,
            featuredExpiresAt: property.featuredExpiresAt ? property.featuredExpiresAt.toISOString() : null,
          }}
          isPending={!!pendingTx}
          planType={statusDetails.planType}
          featuredCount={statusDetails.featuredCount}
          maxFeatured={statusDetails.maxFeatured}
          hasFreeSlot={statusDetails.hasFreeSlot}
        />

      </div>
    </div>
  );
}

