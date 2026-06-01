'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { moderatePropertyAction } from '@/app/actions/properties';
import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  BarChart3,
  Check,
  X,
  Award,
  CheckCircle2,
  Trash2,
  Users,
  MessageSquare,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export interface DuplicateGroup {
  sharedImageUrls: string[];
  properties: {
    id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    province: string;
    status: string;
    contactPhone: string;
    imageUrl?: string;
    userEmail: string;
  }[];
}

interface AdminProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  province: string;
  status: string;
  featured: boolean;
  verified: boolean;
  contactPhone: string;
  imageUrl?: string;
  userEmail: string;
}

interface AdminReport {
  id: string;
  propertyId: string;
  reason: string;
  details?: string | null;
  status: string;
  createdAt: Date;
  property: {
    title: string;
    slug: string;
  };
  user?: {
    email: string;
  } | null;
}

interface AdminClientProps {
  initialProperties: AdminProperty[];
  initialReports: AdminReport[];
  metrics: {
    usersCount: number;
    verifiedPhones: number;
    totalProperties: number;
    activeProperties: number;
    whatsappClicks: number;
    reportsCount: number;
  };
  duplicateGroups: DuplicateGroup[];
}

export default function AdminClient({
  initialProperties,
  initialReports,
  metrics,
  duplicateGroups: initialDuplicateGroups,
}: AdminClientProps) {
  const { showToast } = useApp();
  
  const [activeTab, setActiveTab] = useState<'moderation' | 'reports' | 'metrics' | 'duplicates'>('moderation');
  const [properties, setProperties] = useState<AdminProperty[]>(initialProperties);
  const [reports, setReports] = useState<AdminReport[]>(initialReports);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>(initialDuplicateGroups);

  const handleModerate = async (
    propertyId: string,
    action: 'approve' | 'reject' | 'delete' | 'feature' | 'verify'
  ) => {
    setActionLoadingId(`${propertyId}-${action}`);
    const res = await moderatePropertyAction(propertyId, action);
    setActionLoadingId(null);

    if (res.success) {
      showToast(res.message, 'success');
      
      // Update local state dynamically
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id !== propertyId) return p;
          
          if (action === 'approve') return { ...p, status: 'active' };
          if (action === 'reject') return { ...p, status: 'rejected' };
          if (action === 'feature') return { ...p, featured: !p.featured };
          if (action === 'verify') return { ...p, verified: !p.verified };
          return p;
        }).filter((p) => !(action === 'delete' && p.id === propertyId))
      );
    } else {
      showToast(res.message || 'Error al procesar acción.', 'error');
    }
  };

  const pendingProperties = properties.filter((p) => p.status === 'pending');
  const totalDuplicateAlerts = duplicateGroups.reduce((sum, g) => sum + g.properties.length, 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Tab bar header - Minimalist sardo border */}
      <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-800 pb-px">
        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 pb-4 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'moderation'
              ? 'border-primary text-primary'
              : 'border-transparent text-stone-450 hover:text-stone-750 dark:hover:text-stone-250'
          }`}
        >
          <FileText className="h-4.5 w-4.5" />
          <span>Moderación ({properties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center gap-2 pb-4 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'duplicates'
              ? 'border-primary text-primary'
              : 'border-transparent text-stone-450 hover:text-stone-750 dark:hover:text-stone-250'
          }`}
        >
          <ShieldAlert className="h-4.5 w-4.5 text-amber-600" />
          <span>Similitud / Spam ({totalDuplicateAlerts > 0 ? totalDuplicateAlerts : pendingProperties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 pb-4 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'border-primary text-primary'
              : 'border-transparent text-stone-450 hover:text-stone-750 dark:hover:text-stone-250'
          }`}
        >
          <AlertTriangle className="h-4.5 w-4.5 text-red-650" />
          <span>Reportes ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 pb-4 px-5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'metrics'
              ? 'border-primary text-primary'
              : 'border-transparent text-stone-450 hover:text-stone-750 dark:hover:text-stone-250'
          }`}
        >
          <BarChart3 className="h-4.5 w-4.5" />
          <span>Métricas de Control</span>
        </button>
      </div>

      {/* TAB 1: Moderación de Publicaciones */}
      {activeTab === 'moderation' && (
        <div className="space-y-4 animate-fadeIn">
          {properties.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 text-stone-450">
              No hay publicaciones listadas en el sistema.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-950 font-bold text-stone-450 uppercase tracking-widest text-[9px] border-b border-stone-200 dark:border-stone-850">
                    <tr>
                      <th className="px-6 py-4">Inmueble</th>
                      <th className="px-6 py-4">Propietario / Email</th>
                      <th className="px-6 py-4">Precio</th>
                      <th className="px-6 py-4">Ubicación</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acción de Auditoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-850 font-medium text-stone-700 dark:text-stone-300">
                    {properties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-950/20 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/propiedad/${prop.slug}`} className="hover:text-primary hover:underline line-clamp-1 font-bold text-stone-900 dark:text-stone-100">
                            {prop.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold font-mono text-stone-450">{prop.userEmail}</td>
                        <td className="px-6 py-4 text-emerald-700 dark:text-emerald-450 font-extrabold">
                          {prop.currency === 'CRC' ? '₡' : '$'}{prop.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 font-semibold text-stone-500">{prop.province}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            prop.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : prop.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-700'
                              : 'bg-red-500/10 text-red-700'
                          }`}>
                            {prop.status === 'active' ? 'Activo' : prop.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {prop.status !== 'active' && (
                              <button
                                onClick={() => handleModerate(prop.id, 'approve')}
                                className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 hover:bg-emerald-100/60 transition-colors cursor-pointer"
                                title="Aprobar Anuncio"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            {prop.status !== 'rejected' && (
                              <button
                                onClick={() => handleModerate(prop.id, 'reject')}
                                className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-700 hover:bg-amber-100/60 transition-colors cursor-pointer"
                                title="Rechazar Anuncio"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                            
                            {/* Toggle featured */}
                            <button
                              onClick={() => handleModerate(prop.id, 'feature')}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                prop.featured
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-amber-600'
                              }`}
                              title="Destacar Anuncio Premium"
                            >
                              <Award className="h-4 w-4" />
                            </button>

                            {/* Toggle verified */}
                            <button
                              onClick={() => handleModerate(prop.id, 'verify')}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                prop.verified
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-emerald-600'
                              }`}
                              title="Verificar por OTP"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>

                            {/* Delete Permanent */}
                            <button
                              onClick={() => handleModerate(prop.id, 'delete')}
                              className="p-1.5 rounded bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                              title="Eliminar Anuncio Definitivamente"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Sospecha de Duplicados — Real image-based detection */}
      {activeTab === 'duplicates' && (
        <div className="space-y-6 animate-fadeIn">
          {duplicateGroups.length === 0 && pendingProperties.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 text-stone-450">
              No hay publicaciones bajo sospecha de duplicación en el sistema. ¡Filtros de control limpios!
            </div>
          ) : (
            <>
              {/* Image-based duplicate groups */}
              {duplicateGroups.map((group, gi) => (
                <div key={gi} className="rounded-xl border-2 border-amber-400/40 dark:border-amber-600/30 bg-white dark:bg-stone-900 overflow-hidden shadow-sm">
                  {/* Group header */}
                  <div className="bg-amber-50/80 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 px-5 py-3 flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <h3 className="font-display font-bold text-stone-900 dark:text-stone-100 text-sm">
                        Grupo de duplicados #{gi + 1} — {group.properties.length} anuncios comparten {group.sharedImageUrls.length} foto{group.sharedImageUrls.length > 1 ? 's' : ''} idéntica{group.sharedImageUrls.length > 1 ? 's' : ''}
                      </h3>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-0.5">
                        Se detectaron URLs de imágenes exactamente iguales entre distintos anuncios.
                      </p>
                    </div>
                  </div>

                  {/* Shared image evidence */}
                  {group.sharedImageUrls.length > 0 && (
                    <div className="px-5 py-3 bg-stone-50/50 dark:bg-stone-950/30 border-b border-stone-200 dark:border-stone-850">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-2">Evidencia — Fotos compartidas</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {group.sharedImageUrls.slice(0, 4).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Imagen duplicada ${i + 1}`}
                            className="h-20 w-20 object-cover rounded-lg border-2 border-amber-300 dark:border-amber-700 shrink-0"
                          />
                        ))}
                        {group.sharedImageUrls.length > 4 && (
                          <div className="h-20 w-20 flex items-center justify-center rounded-lg border-2 border-dashed border-amber-300 dark:border-amber-700 text-amber-600 text-xs font-bold shrink-0">
                            +{group.sharedImageUrls.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Properties in this duplicate group */}
                  <div className="divide-y divide-stone-100 dark:divide-stone-850">
                    {group.properties.map((prop) => (
                      <div key={prop.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {prop.imageUrl && (
                            <img
                              src={prop.imageUrl}
                              alt={prop.title}
                              className="h-12 w-12 object-cover rounded-lg border border-stone-200 dark:border-stone-700 shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <Link href={`/propiedad/${prop.slug}`} className="font-bold text-sm text-stone-900 dark:text-stone-100 hover:text-primary line-clamp-1">
                              {prop.title}
                            </Link>
                            <p className="text-[9px] font-bold font-mono text-stone-400 mt-0.5">
                              {prop.userEmail} · {prop.province} · {prop.currency === 'CRC' ? '₡' : '$'}{prop.price.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`inline-flex rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                            prop.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-700'
                              : prop.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-700'
                              : 'bg-red-500/10 text-red-700'
                          }`}>
                            {prop.status === 'active' ? 'Activo' : prop.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                          </span>

                          <Link
                            href={`/propiedad/${prop.slug}`}
                            className="p-1.5 rounded bg-stone-50 dark:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
                            title="Inspeccionar"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>

                          <button
                            onClick={() => handleModerate(prop.id, 'reject')}
                            className="p-1.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-700 hover:bg-amber-100/60 transition-colors cursor-pointer"
                            title="Rechazar"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              handleModerate(prop.id, 'delete');
                              setDuplicateGroups(prev =>
                                prev.map(g => ({
                                  ...g,
                                  properties: g.properties.filter(p => p.id !== prop.id),
                                })).filter(g => g.properties.length >= 2)
                              );
                            }}
                            className="p-1.5 rounded bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                            title="Eliminar definitivamente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Legacy pending properties (spam-flagged at publish time) */}
              {pendingProperties.length > 0 && (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mt-4">Propiedades en revisión manual</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingProperties.map((prop) => (
                      <div key={prop.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4 shadow-sm">
                        <div>
                          <span className="inline-flex rounded bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                            Revisión pendiente
                          </span>
                          <h3 className="font-display font-bold text-stone-900 dark:text-stone-100 line-clamp-1">{prop.title}</h3>
                          <p className="text-[9px] font-bold text-stone-400 mt-1 uppercase font-mono">Email: {prop.userEmail}</p>
                        </div>
                        <div className="flex items-center gap-3 justify-end border-t border-stone-100 dark:border-stone-850 pt-4 mt-2">
                          <Link href={`/propiedad/${prop.slug}`} className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-stone-400 hover:text-stone-600 mr-auto">
                            <ExternalLink className="h-3.5 w-3.5" /><span>Inspeccionar</span>
                          </Link>
                          <button onClick={() => handleModerate(prop.id, 'reject')} className="btn-danger py-1.5 px-3 text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                            <X className="h-4 w-4" /><span>Rechazar</span>
                          </button>
                          <button onClick={() => handleModerate(prop.id, 'approve')} className="btn-whatsapp py-1.5 px-3.5 text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-sm">
                            <Check className="h-4 w-4" /><span>Validar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: Reportes de Usuarios */}
      {activeTab === 'reports' && (
        <div className="space-y-4 animate-fadeIn">
          {reports.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 text-stone-450">
              No se han reportado publicaciones en la plataforma por parte de la comunidad costarricense.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-700 mb-2 uppercase tracking-wider">
                        Reporte: {report.reason}
                      </span>
                      <h3 className="font-display font-bold text-stone-800 dark:text-stone-100">
                        Anuncio objetado: <Link href={`/propiedad/${report.property.slug}`} className="text-primary hover:underline font-extrabold">{report.property.title}</Link>
                      </h3>
                      {report.user && <p className="text-[9px] font-bold font-mono text-stone-450 mt-1 uppercase">Reportado por: {report.user.email}</p>}
                    </div>
                  </div>

                  {report.details && (
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium leading-relaxed bg-stone-50 dark:bg-stone-950 p-3 rounded-lg border border-stone-100 dark:border-stone-850">
                      Detalles del denunciante: "{report.details}"
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t border-stone-100 dark:border-stone-850 pt-3 mt-1">
                    <button
                      onClick={() => handleModerate(report.propertyId, 'delete')}
                      className="btn-danger bg-red-600 hover:bg-red-700 text-white border-transparent py-2 px-4.5 text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Dar de Baja</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Métricas del MVP */}
      {activeTab === 'metrics' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-center shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 mx-auto mb-3">
                <Users className="h-5 w-5" />
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-white font-display tracking-tight">{metrics.usersCount}</div>
              <div className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">Usuarios</div>
            </div>

            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-center shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 mx-auto mb-3">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-white font-display tracking-tight">{metrics.verifiedPhones}</div>
              <div className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">Móviles Verificados</div>
            </div>

            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-center shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 mx-auto mb-3">
                <FileText className="h-5 w-5" />
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-white font-display tracking-tight">
                {metrics.activeProperties} <span className="text-xs text-stone-400">/ {metrics.totalProperties}</span>
              </div>
              <div className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">Propiedades Activas</div>
            </div>

            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 text-center shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 mx-auto mb-3">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-white font-display tracking-tight">{metrics.whatsappClicks}</div>
              <div className="text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">Conversiones WhatsApp</div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-stone-900 dark:text-white tracking-tight">Resumen de Monetización del Portal</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl font-medium">
              El MVP está listo para ser monetizado en Fase 2 de forma transparente. El sistema ya clasifica propiedades como **Destacadas (Featured)** o **Verificadas (Verified)**, permitiendo cobrar un extra de forma manual (mediante SINPE Móvil o Transferencia) y activándolas con un simple clic desde este panel.
            </p>
            <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-350 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded border border-emerald-100">
              <span>🚀 Base de facturación e integraciones pasarela al 100% preparadas.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
