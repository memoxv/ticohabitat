import React from 'react';
import { getSession } from '@/lib/session';
import Link from 'next/link';
import {
  getAdminProperties,
  getAdminReports,
  getDashboardMetrics,
  getAdminSuspiciousDuplicates,
} from '@/lib/properties';
import AdminClient from '@/components/AdminClient';
import { CreditCard } from 'lucide-react';

export const revalidate = 0; // Fresh administration state always

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getSession();

  // Route security: Only admins allowed
  if (!session || session.role !== 'ADMIN') {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 text-center hero-gradient min-h-[60vh]">
        <h1 className="text-3xl font-extrabold text-red-500">
          {locale === 'en' ? 'Access Denied' : 'Acceso Denegado'}
        </h1>
        <p className="text-slate-500 mt-1 mb-6 max-w-sm">
          {locale === 'en' 
            ? 'A TicoHabitat administrator account is required to access this moderation area.' 
            : 'Se requiere una cuenta de administrador de TicoHabitat para acceder a esta área de moderación.'}
        </p>
        <Link href={`/${locale}/login`} className="bg-slate-900 hover:bg-slate-855 text-white font-semibold px-6 py-3 rounded-2xl shadow">
          {locale === 'en' ? 'Log In as Administrator' : 'Iniciar Sesión como Administrador'}
        </Link>
      </div>
    );
  }

  // Fetch admin datasets
  const [properties, reports, metrics, duplicateGroups] = await Promise.all([
    getAdminProperties(),
    getAdminReports(),
    getDashboardMetrics(),
    getAdminSuspiciousDuplicates(),
  ]);

  return (
    <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/10 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <span>{locale === 'en' ? 'Home' : 'Inicio'}</span>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-350 font-semibold">
            {locale === 'en' ? 'Administration' : 'Administración'}
          </span>
        </div>

        {/* Title */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              <span>{locale === 'en' ? 'Moderation & Metrics Panel' : 'Panel de Moderación & Métricas'}</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {locale === 'en'
                ? 'Manage reports, check duplicate/spam alerts, and audit MVP performance.'
                : 'Administra reportes, revisa alertas de duplicados/spam y audita el rendimiento del MVP.'}
            </p>
          </div>
          
          <Link
            href={`/${locale}/admin/monetizacion`}
            className="btn-primary py-2.5 px-4 text-xs inline-flex items-center gap-1.5 shadow-sm font-semibold cursor-pointer shrink-0 self-start sm:self-center"
          >
            <CreditCard className="h-4 w-4" />
            <span>{locale === 'en' ? 'Monetization (SINPE Payments)' : 'Monetización (Pagos SINPE)'}</span>
          </Link>
        </div>

        {/* Client-side Tab & Operation Controller */}
        <AdminClient
          initialProperties={properties.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            price: p.price,
            currency: p.currency,
            province: p.province,
            status: p.status,
            featured: p.featured,
            verified: p.verified,
            contactPhone: p.contactPhone,
            imageUrl: p.images?.[0]?.url,
            userEmail: p.user.email,
            featuredExpiresAt: p.featuredExpiresAt,
          }))}
          initialReports={reports.map((r) => ({
            id: r.id,
            userId: r.userId,
            propertyId: r.propertyId,
            reason: r.reason,
            details: r.details,
            status: r.status,
            createdAt: r.createdAt,
            property: r.property,
            user: r.user,
          }))}
          metrics={metrics}
          duplicateGroups={duplicateGroups}
        />

      </div>
    </div>
  );
}
