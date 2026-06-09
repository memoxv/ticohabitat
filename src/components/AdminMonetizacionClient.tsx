'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { moderateTransactionAction } from '@/app/actions/admin';
import {
  Check,
  X,
  CreditCard,
  User,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
  Building,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from '@/lib/translations';

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  referenceId: string | null;
  durationDays: number | null;
  paymentMethod: string;
  receiptUrl: string;
  status: string;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    planType: string;
  };
  property?: {
    title: string;
    slug: string;
    price: number;
    currency: string;
    province: string;
  } | null;
}

interface AdminMonetizacionClientProps {
  initialTransactions: any[];
}

export default function AdminMonetizacionClient({ initialTransactions }: AdminMonetizacionClientProps) {
  const { showToast, language } = useApp();
  const t = getTranslations(language);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<{ [key: string]: string }>({});

  const handleAction = async (txId: string, status: 'approved' | 'rejected') => {
    const notes = rejectNotes[txId] || (status === 'approved' ? (language === 'en' ? 'SINPE receipt validated successfully. Feature/Plan Active!' : 'Comprobante SINPE validado con éxito. ¡Destaque/Plan Activo!') : (language === 'en' ? 'Transaction rejected.' : 'Transacción rechazada.'));
    
    if (status === 'rejected' && !rejectNotes[txId]?.trim()) {
      showToast(language === 'en' ? 'Please write a note explaining the reason for the rejection.' : 'Por favor escribe una nota explicando la razón del rechazo.', 'error');
      return;
    }

    setLoadingId(`${txId}-${status}`);
    const res = await moderateTransactionAction(txId, status, notes);
    setLoadingId(null);

    if (res.success) {
      showToast(res.message, 'success');
      // Optimistic update: remove item from list
      setTransactions((prev) => prev.filter((t) => t.id !== txId));
    } else {
      showToast(res.message || (language === 'en' ? 'Error processing moderation.' : 'Error al procesar moderación.'), 'error');
    }
  };

  const handleNoteChange = (txId: string, value: string) => {
    setRejectNotes((prev) => ({ ...prev, [txId]: value }));
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card-bg p-12 text-center max-w-xl mx-auto shadow-sm">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4 animate-bounce" />
          <h3 className="font-display font-black text-xl text-stone-900 dark:text-white mb-2 uppercase tracking-wider">
            {language === 'en' ? 'All Up to Date!' : '¡Todo al Día!'}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            {language === 'en'
              ? 'There are no pending SINPE mobile payment approval requests. All featured listings and premium plans are fully moderated and active.'
              : 'No hay solicitudes de pagos SINPE móviles pendientes de aprobación. Todos los destaques y planes premium están debidamente moderados y activos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {transactions.map((tx) => {
            const isFeaturedTx = tx.type === 'featured_listing';
            const isPremiumTx = tx.type === 'premium_plan';
            const isAgencyTx = tx.type === 'agency_plan';

            return (
              <div
                key={tx.id}
                className="rounded-2xl border border-card-border bg-card-bg overflow-hidden shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 lg:grid-cols-3"
              >
                {/* Visual Description Panel */}
                <div className="p-6 lg:p-8 lg:col-span-2 space-y-6 flex flex-col justify-between">
                  <div className="space-y-5">
                    {/* Header: Badge & Amount */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        {isFeaturedTx && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-405 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-250/25">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>{language === 'en' ? `Individual Feature (${tx.durationDays} Days)` : `Destaque Individual (${tx.durationDays} Días)`}</span>
                          </span>
                        )}

                        {isPremiumTx && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-700 dark:text-amber-455 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-300/30">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 animate-pulse" />
                            <span>{language === 'en' ? 'Premium Broker Plan ⭐' : 'Plan Corredor Premium ⭐'}</span>
                          </span>
                        )}

                        {isAgencyTx && (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-955/20 text-emerald-850 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-255/25">
                            <Building className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{language === 'en' ? 'Agency / Real Estate Plan 🏢' : 'Plan Inmobiliaria / Agencia 🏢'}</span>
                          </span>
                        )}
                      </div>

                      <div className="font-display font-black text-2xl text-emerald-700 dark:text-emerald-455">
                        ₡{tx.amount.toLocaleString()}
                      </div>
                    </div>

                    {/* Metadata detail block */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-background p-5 rounded-xl border border-card-border">
                      
                      {/* User Info */}
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
                          <User className="h-3.5 w-3.5" />
                          <span>{language === 'en' ? 'Advertiser' : 'Anunciante'}</span>
                        </div>
                        <div className="text-xs font-bold text-stone-855 dark:text-stone-100">
                          {tx.user.name || (language === 'en' ? 'TicoHabitat User' : 'Usuario TicoHabitat')}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                          {tx.user.email}
                        </div>
                      </div>

                      {/* Date & Reference */}
                      <div className="space-y-1">
                        <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{language === 'en' ? 'Request Date' : 'Fecha Solicitud'}</span>
                        </div>
                        <div className="text-xs font-bold text-stone-855 dark:text-stone-100">
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[9px] uppercase font-mono tracking-widest text-stone-400">
                          ID: {tx.id.substring(0, 8)}
                        </div>
                      </div>

                      {/* Property details (only for featured listings) */}
                      {isFeaturedTx && tx.property && (
                        <div className="sm:col-span-2 space-y-1.5 border-t border-stone-200/50 dark:border-stone-800 pt-3">
                          <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400">
                            {language === 'en' ? 'Target Property' : 'Propiedad Destinataria'}
                          </div>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link
                                href={`/propiedad/${tx.property.slug}`}
                                className="text-xs font-bold text-primary hover:underline line-clamp-1 flex items-center gap-1"
                                target="_blank"
                              >
                                {tx.property.title}
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </Link>
                              <span className="text-[10px] text-stone-450 uppercase">{tx.property.province}</span>
                            </div>
                            <span className="text-xs font-bold text-stone-700 dark:text-stone-300 font-mono">
                              {tx.property.currency === 'CRC' ? '₡' : '$'}{tx.property.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Agency custom details (only for agency) */}
                      {isAgencyTx && tx.notes && (
                        <div className="sm:col-span-2 space-y-1 border-t border-stone-200/50 dark:border-stone-800 pt-3 text-xs">
                          <div className="text-[9px] uppercase font-bold tracking-wider text-stone-400">
                            {language === 'en' ? 'Real Estate Agency Details' : 'Detalles de la Inmobiliaria'}
                          </div>
                          {(() => {
                            try {
                              const parsed = JSON.parse(tx.notes || '{}');
                              return (
                                <div className="flex items-center gap-3">
                                  {parsed.agencyLogo && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={parsed.agencyLogo}
                                      alt="Logo"
                                      className="h-8 w-8 object-cover rounded border border-stone-200 shadow-sm"
                                    />
                                  )}
                                  <span className="font-extrabold text-stone-800 dark:text-white uppercase tracking-wide">
                                    🏢 {parsed.agencyName || (language === 'en' ? 'Unnamed' : 'Sin nombre')}
                                  </span>
                                </div>
                              );
                            } catch {
                              return <span className="text-stone-500">{language === 'en' ? 'Corrupted agency data format.' : 'Formato de datos de inmobiliaria corrupto.'}</span>;
                            }
                          })()}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Feedback Inputs & CTA Buttons */}
                  <div className="space-y-4 pt-4 border-t border-stone-100 dark:border-stone-850">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-stone-400">
                        {language === 'en' ? 'Moderation Notes / Feedback to Advertiser (Mandatory on Rejections)' : 'Notas de Moderación / Feedback al Anunciante (Obligatorio en Rechazos)'}
                      </label>
                      <input
                        type="text"
                        placeholder={language === 'en' ? 'E.g. Receipt validated successfully. / Bank reference not found, please re-submit receipt.' : 'Ej. Comprobante validado con éxito. / Referencia bancaria no encontrada, favor re-enviar comprobante.'}
                        value={rejectNotes[tx.id] || ''}
                        onChange={(e) => handleNoteChange(tx.id, e.target.value)}
                        className="w-full text-xs font-sans rounded-lg border border-stone-200 dark:border-stone-800 dark:bg-stone-900 dark:text-white p-3 focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => handleAction(tx.id, 'rejected')}
                        disabled={loadingId !== null}
                        className="btn-danger py-2.5 px-4 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {loadingId === `${tx.id}-rejected` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 shrink-0" />
                        )}
                        <span>{language === 'en' ? 'Reject SINPE' : 'Rechazar SINPE'}</span>
                      </button>

                      <button
                        onClick={() => handleAction(tx.id, 'approved')}
                        disabled={loadingId !== null}
                        className="btn-whatsapp py-2.5 px-4.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {loadingId === `${tx.id}-approved` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 shrink-0" />
                        )}
                        <span>{language === 'en' ? 'Approve & Activate' : 'Aprobar y Activar'}</span>
                      </button>
                    </div>
                  </div>
                </div>                {/* Receipt View Column */}
                <div
                  className="bg-stone-100 dark:bg-stone-950 p-6 flex flex-col justify-center items-center border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-850 cursor-pointer group/receipt relative overflow-hidden"
                  onClick={() => setSelectedReceipt(tx.receiptUrl)}
                >
                  <div className="absolute inset-0 bg-stone-955/40 opacity-0 group-hover/receipt:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <span className="bg-white/95 text-stone-900 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4" />
                      {language === 'en' ? 'Expand Receipt' : 'Ampliar Comprobante'}
                    </span>
                  </div>

                  <div className="relative aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-xl border border-stone-250 dark:border-stone-800 shadow-sm bg-white dark:bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tx.receiptUrl}
                      alt={language === 'en' ? 'SINPE Receipt' : 'Comprobante SINPE'}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover/receipt:scale-102"
                    />
                  </div>

                  <span className="text-[10px] uppercase font-bold text-stone-400 mt-4 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {language === 'en' ? 'Click to enlarge screenshot' : 'Haga clic para ampliar captura'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox zoomed modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
          onClick={() => setSelectedReceipt(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] w-full rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-800 p-2 shadow-2xl flex flex-col justify-center items-center animate-scaleIn">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 z-10 bg-stone-900/90 text-white rounded-full p-2 hover:bg-stone-950 shadow-md cursor-pointer border border-stone-700"
            >
              <X className="h-5 w-5" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedReceipt}
              alt={language === 'en' ? 'Enlarged SINPE Receipt' : 'Comprobante SINPE Ampliado'}
              className="max-w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
