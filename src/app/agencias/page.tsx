import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { Building2, Search, Building, MapPin, Mail, ArrowRight } from 'lucide-react';
import { getTranslations } from '@/lib/translations';
import { getServerLanguage } from '@/lib/serverTranslations';

export const revalidate = 0; // Dynamic content always

export const metadata: Metadata = {
  title: 'Directorio de Inmobiliarias y Agencias | TicoHabitat',
  description: 'Encuentre las inmobiliarias y agencias profesionales más destacadas en Costa Rica. Asesores verificados con trato directo y listings premium.',
  alternates: {
    canonical: '/agencias',
  },
};

interface AgenciasPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function AgenciasPage({ searchParams }: AgenciasPageProps) {
  const lang = await getServerLanguage();
  const t = getTranslations(lang);

  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams.search || '';

  // Query only users with active AGENCY plan
  const agencies = await db.user.findMany({
    where: {
      planType: 'AGENCY',
      planExpiresAt: {
        gt: new Date(),
      },
      agencyName: {
        not: null,
      },
      OR: search
        ? [
            { agencyName: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      agencyName: true,
      agencyLogo: true,
    },
    orderBy: {
      agencyName: 'asc',
    },
  });

  // 1. Fetch all linked agents for all agencies in a single query
  const agencyIds = agencies.map((a) => a.id);
  const allLinkedAgents = agencyIds.length > 0
    ? await db.user.findMany({
        where: { linkedAgencyId: { in: agencyIds } },
        select: { id: true, linkedAgencyId: true },
      })
    : [];

  // Group agent IDs by agency owner ID
  const agencyAgentsMap: Record<string, string[]> = {};
  agencies.forEach((a) => {
    agencyAgentsMap[a.id] = [];
  });
  allLinkedAgents.forEach((agent) => {
    if (agent.linkedAgencyId && agencyAgentsMap[agent.linkedAgencyId]) {
      agencyAgentsMap[agent.linkedAgencyId].push(agent.id);
    }
  });

  // Collect all user IDs involved (owners + agents)
  const allTeamUserIds = [...agencyIds, ...allLinkedAgents.map((a) => a.id)];

  // 2. Fetch active property counts grouped by userId in a single query
  const activeListingsGrouped = allTeamUserIds.length > 0
    ? await db.property.groupBy({
        by: ['userId'],
        where: {
          userId: { in: allTeamUserIds },
          status: 'active',
        },
        _count: {
          id: true,
        },
      })
    : [];

  // Convert to quick count lookup map
  const userPropertyCountMap: Record<string, number> = {};
  activeListingsGrouped.forEach((group) => {
    userPropertyCountMap[group.userId] = group._count.id;
  });

  // 3. Assemble enriched agencies efficiently in-memory
  const enrichedAgencies = agencies.map((owner) => {
    const agents = agencyAgentsMap[owner.id] || [];
    const teamIds = [owner.id, ...agents];
    const activeListingsCount = teamIds.reduce(
      (sum, uid) => sum + (userPropertyCountMap[uid] || 0),
      0
    );

    return {
      ...owner,
      agentsCount: agents.length,
      activeListingsCount,
    };
  });

  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-stone-400 dark:text-stone-550 mb-8 uppercase tracking-wider">
          <Link href="/" className="hover:text-primary transition-colors">{t.common.home}</Link>
          <span>/</span>
          <span className="text-stone-600 dark:text-stone-300">{t.agencias.breadcrumb}</span>
        </div>

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 dark:bg-emerald-500/5 px-2.5 py-1 rounded-md">
              <Building className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t.agencias.authorizedBrokers}</span>
            </span>
            <h1 className="font-display text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight">
              {lang === 'en' ? 'Real Estate ' : 'Directorio de '}<span className="text-emerald-600">{lang === 'en' ? 'Agencies' : 'Inmobiliarias'}</span>
            </h1>
            <p className="text-sm font-medium text-stone-500 dark:text-stone-400 leading-relaxed">
              {t.agencias.subtitle}
            </p>
          </div>

          {/* Search Form - 100% Server Driven */}
          <form method="GET" action="/agencias" className="w-full md:w-80 flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder={t.agencias.searchPlaceholder}
                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500 text-stone-800 dark:text-white"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            </div>
            <button
              type="submit"
              className="bg-stone-900 hover:bg-stone-850 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
            >
              {t.agencias.filterBtn}
            </button>
          </form>
        </div>

        {/* Grid Showcase */}
        {enrichedAgencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrichedAgencies.map((agency) => (
              <div
                key={agency.id}
                className="group relative flex flex-col justify-between bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm hover-lift transition-all duration-300 hover:border-emerald-500/20"
              >
                <div>
                  {/* Agency Brand Header */}
                  <div className="flex items-start gap-4 mb-5">
                    {agency.agencyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={agency.agencyLogo}
                        alt={agency.agencyName || 'Logotipo Inmobiliario'}
                        className="h-14 w-14 object-cover rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs bg-white"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 flex items-center justify-center border border-stone-200 dark:border-stone-800 shadow-xs">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-display font-black text-base text-stone-850 dark:text-white uppercase tracking-wide truncate group-hover:text-emerald-600 transition-colors">
                        {agency.agencyName}
                      </h3>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-0.5">
                        {t.agencias.verifiedAgency}
                      </p>
                    </div>
                  </div>

                  {/* Agency Bio / Meta */}
                  <div className="space-y-2 border-t border-stone-100 dark:border-stone-850/60 pt-4 mb-6">
                    <div className="flex items-center gap-2 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                      <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span>{t.agencias.nationalScope}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-stone-500 dark:text-stone-400">
                      <Mail className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{agency.email}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom stats and link */}
                <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-850/60">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-450 tracking-wider">
                    <span>👥 {t.agencias.collaborators}</span>
                    <span className="text-stone-700 dark:text-stone-300">
                      {1 + agency.agentsCount} {1 + agency.agentsCount === 1 ? t.agencias.agent : t.agencias.agents}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-stone-450 tracking-wider">
                    <span>🏠 {t.agencias.activeListings}</span>
                    <span className="text-emerald-700 dark:text-emerald-450 font-black">
                      {agency.activeListingsCount} {agency.activeListingsCount === 1 ? t.agencias.ad : t.agencias.ads}
                    </span>
                  </div>

                  <Link
                    href={`/comprar?search=${encodeURIComponent(agency.agencyName || '')}`}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 py-3 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/25 bg-stone-50/50 dark:bg-stone-900/10 hover:bg-emerald-500/5 hover:text-emerald-700 dark:hover:text-emerald-450 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-stone-650 dark:text-stone-300 transition-all cursor-pointer shadow-xs active:scale-[0.985]"
                  >
                    <span>{t.agencias.viewProperties}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-16 bg-card-bg border border-dashed border-card-border rounded-2xl shadow-sm">
            <Building2 className="h-12 w-12 text-stone-300 dark:text-stone-750 mb-3 animate-pulse" />
            <h3 className="font-display font-bold text-lg text-stone-850 dark:text-stone-200">{t.agencias.emptyTitle}</h3>
            <p className="text-xs text-stone-450 dark:text-stone-555 mt-1 max-w-sm leading-relaxed">
              {t.agencias.emptyDesc}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
