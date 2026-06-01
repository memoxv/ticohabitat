import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import PlanesClient from '@/components/PlanesClient';

export default async function PlanesPage() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Fetch user profile and transaction history in parallel to speed up page load
  const [dbUser, transactions] = await Promise.all([
    db.user.findUnique({
      where: { id: session.userId },
      select: {
        planType: true,
        planExpiresAt: true,
        agencyName: true,
        agencyLogo: true,
      },
    }),
    db.transaction.findMany({
      where: {
        userId: session.userId,
        type: { in: ['premium_plan', 'agency_plan'] },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!dbUser) {
    redirect('/login');
  }

  return (
    <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/10 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <span>Inicio</span>
          <span>/</span>
          <span>Mi Panel</span>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-350">Planes y Precios</span>
        </div>

        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            Planes de Publicación y Suscripciones
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Mejora tu visibilidad, publica anuncios ilimitados y posiciona tu marca inmobiliaria en Costa Rica.
          </p>
        </div>

        <PlanesClient
          currentPlan={{
            type: dbUser.planType,
            expiresAt: dbUser.planExpiresAt ? dbUser.planExpiresAt.toISOString() : null,
            agencyName: dbUser.agencyName,
            agencyLogo: dbUser.agencyLogo,
          }}
          pastTransactions={transactions.map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            status: t.status,
            notes: t.notes,
            createdAt: t.createdAt.toISOString(),
          }))}
        />

      </div>
    </div>
  );
}
