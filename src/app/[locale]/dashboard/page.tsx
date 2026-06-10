import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getUserProperties } from '@/lib/properties';
import { db } from '@/lib/db';
import { getUserEffectivePlan } from '@/lib/planInheritance';
import DashboardClient from '@/components/DashboardClient';

export const revalidate = 0; // Fresh dashboard state always

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();
  
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Fetch independent user details, effective plan, properties, and pending transactions in parallel
  const [dbUser, effectivePlan, properties, pendingFeaturedTxs] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: {
        planType: true,
        planExpiresAt: true,
        agencyName: true,
        role: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    }),
    getUserEffectivePlan(session.userId),
    getUserProperties(session.userId),
    db.transaction.findMany({
      where: {
        userId: session.userId,
        type: 'featured_listing',
        status: 'pending',
      },
      select: {
        referenceId: true,
      },
    }),
  ]);

  if (!dbUser) {
    redirect(`/${locale}/login`);
  }

  const propertyIds = properties.map((p) => p.id);

  // Group metrics by propertyId and event type (only query if they have properties)
  const metrics = propertyIds.length > 0
    ? await db.metric.groupBy({
        by: ['propertyId', 'event'],
        where: {
          propertyId: { in: propertyIds },
          event: { in: ['view', 'whatsapp_click'] },
        },
        _count: true,
      })
    : [];

  // Convert to a quick lookup map
  const metricsMap: Record<string, { views: number; whatsappClicks: number }> = {};
  propertyIds.forEach((id) => {
    metricsMap[id] = { views: 0, whatsappClicks: 0 };
  });

  metrics.forEach((m) => {
    if (m.propertyId) {
      if (m.event === 'view') {
        metricsMap[m.propertyId].views = m._count;
      } else if (m.event === 'whatsapp_click') {
        metricsMap[m.propertyId].whatsappClicks = m._count;
      }
    }
  });

  const pendingIds = new Set(pendingFeaturedTxs.map((t) => t.referenceId).filter(Boolean) as string[]);

  return (
    <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/10 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <span>{locale === 'en' ? 'Home' : 'Inicio'}</span>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-350">{locale === 'en' ? 'My Panel' : 'Mi Panel'}</span>
        </div>

        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
              {locale === 'en' ? 'Hello, ' : 'Hola, '}{dbUser.name || (locale === 'en' ? 'Advertiser' : 'Anunciante')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {locale === 'en' 
                ? 'Manage your published properties, favorite listings, and account status.' 
                : 'Gestiona tus propiedades publicadas, tus anuncios favoritos y el estado de tu cuenta.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <LinkToPlanes locale={locale} />
          </div>
        </div>

        {/* Dashboard Client Controller */}
        <DashboardClient
          initialProperties={properties.map((p) => ({
            id: p.id,
            type: p.type,
            propertyType: p.propertyType,
            title: p.title,
            slug: p.slug,
            price: p.price,
            currency: p.currency,
            province: p.province,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            parkingSpaces: p.parkingSpaces,
            petsAllowed: p.petsAllowed,
            featured: p.featured,
            featuredExpiresAt: p.featuredExpiresAt ? p.featuredExpiresAt.toISOString() : null,
            isFeaturedPending: pendingIds.has(p.id),
            verified: p.verified,
            imageUrl: p.images?.[0]?.url,
            contactPhone: p.contactPhone,
            status: p.status,
            viewsCount: metricsMap[p.id]?.views || 0,
            whatsappClicksCount: metricsMap[p.id]?.whatsappClicks || 0,
          }))}
          userSession={{
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role,
            planType: effectivePlan.planType,
            planExpiresAt: effectivePlan.planExpiresAt ? effectivePlan.planExpiresAt.toISOString() : null,
            agencyName: effectivePlan.agencyName,
            agencyLogo: effectivePlan.agencyLogo,
            emailVerified: dbUser.emailVerified,
            isLinked: effectivePlan.isLinked,
            isOwnerActive: effectivePlan.isOwnerActive,
            linkedAgencyId: effectivePlan.linkedAgencyId,
          }}
        />

      </div>
    </div>
  );
}

import Link from 'next/link';
import { CreditCard } from 'lucide-react';

function LinkToPlanes({ locale }: { locale: string }) {
  return (
    <Link
      href={`/${locale}/dashboard/planes`}
      className="btn-primary py-2.5 px-4 text-xs inline-flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer"
    >
      <CreditCard className="h-4 w-4" />
      <span>{locale === 'en' ? 'Plans & Pricing' : 'Planes y Precios'}</span>
    </Link>
  );
}

