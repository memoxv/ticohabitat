import React from 'react';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import EditPropertyForm from '@/components/EditPropertyForm';

export const revalidate = 0; // Dynamic always

interface EditarPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarPropertyPage({ params }: EditarPageProps) {
  const session = await getSession();

  // 1. Guard check: User must be authenticated to edit listings
  if (!session) {
    redirect('/login');
  }

  const { id } = await params;

  // 2. Fetch the property with its linked images in one query
  const property = await db.property.findUnique({
    where: { id },
    include: {
      images: {
        select: { url: true },
      },
    },
  });

  if (!property) {
    notFound();
  }

  // 3. Security guard check: User must be either the owner of the property OR a platform administrator
  const isOwner = property.userId === session.userId;
  const isAdmin = session.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 text-center hero-gradient min-h-[60vh]">
        <h1 className="text-2xl font-extrabold text-red-500">Acceso Denegado</h1>
        <p className="text-slate-500 mt-2 mb-6 max-w-sm">
          No tiene permisos suficientes para editar este anuncio. Únicamente el propietario o un moderador pueden realizar modificaciones.
        </p>
        <a
          href="/dashboard"
          className="bg-slate-900 hover:bg-slate-850 text-white font-semibold px-6 py-3 rounded-2xl shadow text-xs uppercase tracking-wider"
        >
          Volver al Panel
        </a>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-slate-50/50 dark:bg-slate-900/10 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb - Premium Minimalist */}
        <div className="flex items-center gap-2 text-[10px] font-extrabold text-stone-400 mb-6 uppercase tracking-wider">
          <span>Inicio</span>
          <span>/</span>
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-stone-600 dark:text-stone-300">Editar</span>
        </div>

        <EditPropertyForm property={property} />
      </div>
    </div>
  );
}
