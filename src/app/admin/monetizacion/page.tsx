import React from 'react';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { getPendingTransactionsAction } from '@/app/actions/admin';
import AdminMonetizacionClient from '@/components/AdminMonetizacionClient';
import Link from 'next/link';

export const revalidate = 0; // Fresh administration state always

export default async function AdminMonetizacionPage() {
  const session = await getSession();

  // Route security: Only admins allowed
  if (!session || session.role !== 'ADMIN') {
    redirect('/login');
  }

  // Fetch pending transactions from Server Action
  const res = await getPendingTransactionsAction();

  return (
    <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/10 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <span>Inicio</span>
          <span>/</span>
          <Link href="/admin" className="hover:text-stone-700 dark:hover:text-white">
            Administración
          </Link>
          <span>/</span>
          <span className="text-slate-600 dark:text-slate-350 font-semibold font-sans">Monetización & SINPE</span>
        </div>

        {/* Title */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            Cabina de Aprobación de Pagos (SINPE Móvil)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Audita las transferencias bancarias manuales, visualiza comprobantes y activa planes premium o destaques en un solo clic.
          </p>
        </div>

        <AdminMonetizacionClient
          initialTransactions={res.transactions || []}
        />

      </div>
    </div>
  );
}
