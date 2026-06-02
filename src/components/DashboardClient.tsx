'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { deletePropertyAction, togglePropertyActiveStatusAction } from '@/app/actions/properties';
import PropertyCard from '@/components/PropertyCard';
import Link from 'next/link';
import {
  FileText,
  Heart,
  PlusCircle,
  Phone,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  ExternalLink,
  Compass,
  Sparkles,
  Zap,
  TrendingUp,
  Building,
  UserCheck,
  Calendar,
  CreditCard,
  Copy,
  UserMinus,
} from 'lucide-react';
import {
  linkAgencyWithCodeAction,
  unlinkAgencyAgentAction,
  getAgencyTeamAction,
} from '@/app/actions/monetization';

interface DashboardProperty {
  id: string;
  type: string;
  propertyType: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  province: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  petsAllowed: boolean;
  featured: boolean;
  featuredExpiresAt?: string | null;
  isFeaturedPending?: boolean;
  verified: boolean;
  imageUrl?: string;
  contactPhone: string;
  status: string;
  viewsCount?: number;
  whatsappClicksCount?: number;
}

interface DashboardClientProps {
  initialProperties: DashboardProperty[];
  userSession: {
    name?: string | null;
    email: string;
    role: string;
    planType: string;
    planExpiresAt?: string | null;
    agencyName?: string | null;
    agencyLogo?: string | null;
    emailVerified: boolean;
    isLinked?: boolean;
    isOwnerActive?: boolean;
    linkedAgencyId?: string | null;
  };
}

export default function DashboardClient({ initialProperties, userSession }: DashboardClientProps) {
  const { favorites, showToast, phoneVerified } = useApp();
  
  const [activeTab, setActiveTab] = useState<'my-listings' | 'favorites'>('my-listings');
  const [myProperties, setMyProperties] = useState<DashboardProperty[]>(initialProperties);
  const [favProperties, setFavProperties] = useState<any[]>([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  
  // Agency state variables
  const [agencyCodeInput, setAgencyCodeInput] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [unlinkingLoading, setUnlinkingLoading] = useState(false);
  const [agencyTeam, setAgencyTeam] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    const fetchAgencyTeam = async () => {
      if (userSession.planType === 'AGENCY' || userSession.isLinked) {
        setLoadingTeam(true);
        try {
          const res = await getAgencyTeamAction();
          if (res.success) {
            setAgencyTeam(res);
          }
        } catch (e) {
          console.error("Error loading agency team:", e);
        } finally {
          setLoadingTeam(false);
        }
      }
    };
    fetchAgencyTeam();
  }, [userSession.planType, userSession.isLinked]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Email verification state variables for testing
  const [sendingEmail, setSendingEmail] = useState(false);
  const [verificationLink, setVerificationLink] = useState<string | null>(null);

  // Load favorites details dynamically when favorites change or favorites tab becomes active
  useEffect(() => {
    if (favorites.length === 0) {
      setFavProperties([]);
      return;
    }

    const fetchFavoritesDetails = async () => {
      setLoadingFavs(true);
      try {
        const res = await fetch(`/api/favorites?ids=${favorites.join(',')}`);
        const data = await res.json();
        if (data.items) {
          setFavProperties(data.items);
        }
      } catch (e) {
        console.error('Error fetching favorites', e);
      } finally {
        setLoadingFavs(false);
      }
    };

    fetchFavoritesDetails();
  }, [favorites]);

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente este anuncio?')) {
      return;
    }

    setDeletingId(id);
    const res = await deletePropertyAction(id);
    setDeletingId(null);

    if (res.success) {
      showToast(res.message, 'success');
      setMyProperties((prev) => prev.filter((p) => p.id !== id));
    } else {
      showToast(res.message || 'No se pudo eliminar la propiedad.', 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    
    setStatusUpdatingId(id);
    try {
      const res = await togglePropertyActiveStatusAction(id, newStatus);
      if (res.success) {
        showToast(res.message, 'success');
        setMyProperties((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      } else {
        showToast(res.message || 'No se pudo cambiar el estado del anuncio.', 'error');
      }
    } catch (error) {
      showToast('Error de comunicación con el servidor.', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const activeCount = myProperties.filter((p) => p.status === 'active').length;
  const isPremiumOrAgency = userSession.planType === 'PREMIUM' || userSession.planType === 'AGENCY';
  const remainingFreeListings = isPremiumOrAgency ? 999 : Math.max(3 - activeCount, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      
      {/* Sidebar Panel: Profile & Verification */}
      <div className="lg:col-span-1 space-y-6">
        <div className="rounded-xl border border-card-border bg-card-bg p-6 space-y-5 shadow-sm">
          <h2 className="font-display font-bold text-[10px] uppercase tracking-wider text-stone-400 dark:text-stone-550">Estado de tu Cuenta</h2>
          
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-stone-400 dark:text-stone-550 uppercase">Rol del Anunciante</div>
            <div className="text-xs font-bold text-stone-850 dark:text-white flex items-center gap-1.5">
              <span>{userSession.role === 'ADMIN' ? '👑 Administrador' : '🏠 Corredor Inmobiliario'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-[10px] font-bold text-stone-400 dark:text-stone-550 uppercase font-sans">Correo Electrónico</div>
            <div className="text-xs font-bold text-stone-600 dark:text-stone-300 line-clamp-1 font-mono">{userSession.email}</div>
          </div>

          <hr className="border-stone-100 dark:border-stone-850" />

          {/* Suscription Plan Box */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-stone-400 dark:text-stone-550 uppercase font-sans">Plan de Publicación</div>
            
            {/* 1. Linked Agent (Active Agency Plan) */}
            {userSession.isLinked && userSession.isOwnerActive && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 p-3 bg-emerald-50/40 dark:bg-emerald-950/10 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-bold mb-1">
                  <Building className="h-4 w-4 shrink-0 text-emerald-600 animate-pulse" />
                  <span>Agente de Agencia</span>
                </div>
                {userSession.agencyName && (
                  <div className="text-[11px] font-black text-emerald-900 dark:text-emerald-350 mb-1.5 uppercase font-sans tracking-wide">
                    🏢 {userSession.agencyName}
                  </div>
                )}
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mb-3 leading-relaxed">
                  Tu cuenta cuenta con publicaciones ilimitadas y marca destacada heredadas de tu agencia.
                </p>
                
                <button
                  onClick={async () => {
                    if (!window.confirm('¿Seguro que deseas desvincularte de esta agencia? Volverás al plan básico.')) return;
                    setUnlinkingLoading(true);
                    const res = await unlinkAgencyAgentAction();
                    setUnlinkingLoading(false);
                    if (res.success) {
                      showToast(res.message, 'success');
                      window.location.reload();
                    } else {
                      showToast(res.message || 'Error al desvincularse.', 'error');
                    }
                  }}
                  disabled={unlinkingLoading}
                  className="w-full text-center block border border-stone-250 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900/50 text-stone-600 dark:text-stone-300 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {unlinkingLoading ? 'Desvinculando...' : 'Desvincularme 🏃‍♂️'}
                </button>
              </div>
            )}

            {/* 2. Linked Agent (Inactive/Expired Agency Plan) */}
            {userSession.isLinked && !userSession.isOwnerActive && (
              <div className="rounded-xl border border-red-200 dark:border-red-950 p-3 bg-red-50/50 dark:bg-red-950/10 text-xs">
                <div className="flex items-center gap-1.5 text-red-750 dark:text-red-400 font-black mb-1">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-500 animate-bounce" />
                  <span>Agencia Inactiva</span>
                </div>
                <p className="text-[10.5px] text-stone-650 dark:text-stone-300 mb-3 leading-relaxed">
                  La suscripción de tu agencia ha vencido. Tu cuenta ha sido degradada temporalmente al **Plan Básico (Gratis)**.
                </p>
                
                <button
                  onClick={async () => {
                    if (!window.confirm('¿Deseas desvincularte de la agencia inactiva?')) return;
                    setUnlinkingLoading(true);
                    const res = await unlinkAgencyAgentAction();
                    setUnlinkingLoading(false);
                    if (res.success) {
                      showToast(res.message, 'success');
                      window.location.reload();
                    } else {
                      showToast(res.message || 'Error al desvincularse.', 'error');
                    }
                  }}
                  disabled={unlinkingLoading}
                  className="w-full text-center block border border-red-200 dark:border-red-900 hover:bg-red-500/5 text-red-650 dark:text-red-400 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {unlinkingLoading ? 'Desvinculando...' : 'Desvincularme de Agencia ❌'}
                </button>
              </div>
            )}

            {/* 3. Standard Free User (Not linked) */}
            {userSession.planType === 'FREE' && !userSession.isLinked && (
              <>
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3 bg-stone-50 dark:bg-stone-950/20 text-xs">
                  <div className="flex items-center gap-1 text-stone-700 dark:text-stone-300 font-bold mb-1">
                    <span>Plan Básico (Gratis)</span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 mb-2.5">Límite de 3 publicaciones. Sin destaques incluidos.</p>
                  <Link
                    href="/dashboard/planes"
                    className="w-full text-center block bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Mejorar Plan ⭐
                  </Link>
                </div>

                {/* Linking input panel */}
                <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50/50 dark:bg-stone-900/10 text-xs space-y-2.5 shadow-sm">
                  <div className="font-extrabold text-[9.5px] uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                    <span>¿Trabajas con una Inmobiliaria?</span>
                  </div>
                  <p className="text-[10px] text-stone-500 dark:text-stone-450 leading-relaxed">
                    Vincula tu cuenta ingresando el código único de tu agencia para publicar sin límites.
                  </p>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Código: AG-XXXXXX"
                      value={agencyCodeInput}
                      onChange={(e) => setAgencyCodeInput(e.target.value)}
                      className="bg-white dark:bg-stone-950 border border-stone-250 dark:border-stone-850 rounded-lg px-2 py-1 text-stone-850 dark:text-white font-mono text-[10.5px] focus:outline-none focus:border-stone-400 dark:focus:border-stone-700 flex-grow uppercase"
                      maxLength={9}
                    />
                    <button
                      onClick={async () => {
                        if (!agencyCodeInput.trim()) {
                          showToast('Por favor ingrese un código de agencia.', 'error');
                          return;
                        }
                        setLinkingLoading(true);
                        const res = await linkAgencyWithCodeAction(agencyCodeInput);
                        setLinkingLoading(false);
                        if (res.success) {
                          showToast(res.message, 'success');
                          window.location.reload();
                        } else {
                          showToast(res.message || 'Código inválido o error al vincular.', 'error');
                        }
                      }}
                      disabled={linkingLoading}
                      className="bg-stone-850 dark:bg-white text-white dark:text-stone-950 hover:bg-stone-900 dark:hover:bg-stone-100 rounded-lg px-2.5 py-1 text-[9.5px] font-extrabold uppercase transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {linkingLoading ? '...' : 'Vincular'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 4. Premium Plan (Direct) */}
            {userSession.planType === 'PREMIUM' && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900 p-3 bg-amber-50/50 dark:bg-amber-950/15 text-xs">
                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold mb-1">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
                  <span>Plan Premium</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mb-2">Publicaciones ilimitadas. Sello de anunciante verificado.</p>
                {userSession.planExpiresAt && (
                  <div className="text-[9px] font-bold text-amber-600/80 dark:text-amber-400/80 flex items-center gap-1 font-mono uppercase">
                    <Calendar className="h-3 w-3" />
                    <span>Renueva: {new Date(userSession.planExpiresAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* 5. Agency Owner (Direct) */}
            {userSession.planType === 'AGENCY' && !userSession.isLinked && (
              <>
                <div className="rounded-xl border border-emerald-250 dark:border-emerald-900 p-3 bg-emerald-50/40 dark:bg-emerald-950/10 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-400 font-black mb-1">
                    <Building className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Dueño de Agencia</span>
                  </div>
                  {userSession.agencyName && (
                    <div className="text-[11px] font-black text-stone-700 dark:text-stone-200 mb-1.5 uppercase font-sans tracking-wide">
                      🏢 {userSession.agencyName}
                    </div>
                  )}
                  <p className="text-[11px] text-stone-600 dark:text-stone-300 mb-2">Publicaciones ilimitadas y marca destacada compartida.</p>
                  {userSession.planExpiresAt && (
                    <div className="text-[9px] font-bold text-emerald-700/80 dark:text-emerald-400/80 flex items-center gap-1 font-mono uppercase">
                      <Calendar className="h-3 w-3" />
                      <span>Renueva: {new Date(userSession.planExpiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Agency administration panel */}
                {agencyTeam && (
                  <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50/50 dark:bg-stone-900/10 text-xs space-y-3 shadow-sm">
                    <div className="font-extrabold text-[9.5px] uppercase tracking-wider text-stone-500 dark:text-stone-400">
                      🔑 Código de Vinculación
                    </div>
                    <div className="flex items-center gap-1 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-lg p-1.5 justify-between">
                      <span className="font-mono text-xs font-bold text-stone-800 dark:text-white tracking-wider pl-1.5 select-all">
                        {agencyTeam.agencyCode || 'SIN CÓDIGO'}
                      </span>
                      <button
                        onClick={() => {
                          if (agencyTeam.agencyCode) {
                            navigator.clipboard.writeText(agencyTeam.agencyCode);
                            showToast('¡Código de agencia copiado al portapapeles!', 'success');
                          }
                        }}
                        className="bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-850 p-1.5 rounded-md cursor-pointer text-stone-650 dark:text-stone-300 transition-all flex items-center justify-center border border-transparent hover:border-stone-200 dark:hover:border-stone-800"
                        title="Copiar Código"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    
                    <hr className="border-stone-200/60 dark:border-stone-850/60" />

                    <div className="flex justify-between items-center text-[9px] font-extrabold text-stone-400 dark:text-stone-500 uppercase">
                      <span>Agentes de Equipo</span>
                      <span className="text-stone-600 dark:text-stone-300">
                        {agencyTeam.agents?.length || 0} / 4 Cupos
                      </span>
                    </div>

                    {agencyTeam.agents && agencyTeam.agents.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {agencyTeam.agents.map((agent: any) => (
                          <div
                            key={agent.id}
                            className="rounded-lg border border-stone-200/50 dark:border-stone-850/50 p-2 bg-white dark:bg-stone-950 flex items-center justify-between gap-2 shadow-xs"
                          >
                            <div className="min-w-0 flex-grow">
                              <div className="text-[10px] font-bold text-stone-800 dark:text-stone-250 truncate">
                                👤 {agent.name}
                              </div>
                              <div className="text-[8.5px] font-mono text-stone-500 dark:text-stone-450 truncate">
                                {agent.email}
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`¿Seguro que deseas desvincular al agente ${agent.name}?`)) return;
                                const res = await unlinkAgencyAgentAction(agent.id);
                                if (res.success) {
                                  showToast('Agente desvinculado con éxito.', 'success');
                                  // Update local state immediately
                                  setAgencyTeam((prev: any) => ({
                                    ...prev,
                                    agents: prev.agents.filter((a: any) => a.id !== agent.id)
                                  }));
                                } else {
                                  showToast(res.message || 'Error al desvincular.', 'error');
                                }
                              }}
                              className="text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 p-1.5 rounded transition-all cursor-pointer flex items-center justify-center shrink-0 border border-transparent hover:border-red-200 dark:hover:border-red-950"
                              title="Remover Agente"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9.5px] text-stone-450 dark:text-stone-500 italic text-center py-2 leading-relaxed">
                        Comparte tu código con tus colaboradores para que se vinculen a tu equipo.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <hr className="border-stone-100 dark:border-stone-850" />

          {/* Verification Box - Editorial Clean */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-stone-400 dark:text-stone-550 uppercase tracking-wider">Estado de Verificación</div>
            
            {/* Email Verification Card */}
            {userSession.emailVerified ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 p-3.5 text-xs font-bold text-emerald-800 dark:text-emerald-350 flex items-center gap-2.5">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                <span className="font-extrabold uppercase text-[10px] tracking-wider">✅ Correo verificado</span>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-3.5 text-xs font-bold text-stone-750 dark:text-stone-300 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-amber-500">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="font-extrabold uppercase text-[10px] tracking-wider">📧 Correo no verificado</span>
                </div>
                <p className="font-medium text-[10.5px] text-stone-450 dark:text-stone-400 leading-relaxed">
                  Verifique su correo electrónico para habilitar la publicación sin OTP telefónico.
                </p>
                <button
                  onClick={async () => {
                    setSendingEmail(true);
                    const { sendEmailVerification } = await import('@/app/actions/emailVerification');
                    const res = await sendEmailVerification();
                    setSendingEmail(false);
                    if (res.success) {
                      showToast(res.message, 'success');
                      if (res.verificationLink) {
                        setVerificationLink(res.verificationLink);
                      }
                    } else {
                      showToast(res.message, 'error');
                    }
                  }}
                  disabled={sendingEmail}
                  className="btn-primary py-2 px-3 text-[10px] inline-flex items-center justify-center gap-1.5 self-start cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {sendingEmail ? 'Enviando...' : 'Verificar Correo'}
                </button>

                {verificationLink && (
                  <div className="mt-2 p-2 bg-stone-950 rounded border border-stone-850 text-[10px] font-mono select-all break-all text-stone-300">
                    <span className="block text-[8px] uppercase text-amber-505 font-bold mb-1">Enlace Demo Beta (Copia y pega):</span>
                    {verificationLink}
                  </div>
                )}
              </div>
            )}

            {/* Phone Verification hidden temporarily per user request */}
          </div>

          <hr className="border-stone-100 dark:border-stone-850" />

          {/* Listing Limits Progress bar - Thin apple bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-stone-400 dark:text-stone-550 uppercase tracking-wider">
              <span>Publicaciones Activas</span>
              {isPremiumOrAgency ? (
                <span className="text-emerald-600 font-black">Ilimitadas ⭐</span>
              ) : (
                <span className="text-primary font-black">{activeCount}/3 Activas</span>
              )}
            </div>
            
            {!isPremiumOrAgency && (
              <>
                <div className="h-[3px] w-full bg-stone-150 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(activeCount / 3) * 100}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-stone-450 dark:text-stone-500 uppercase tracking-wider leading-relaxed">
                  {remainingFreeListings > 0
                    ? `Dispone de ${remainingFreeListings} anuncios libres.`
                    : 'Límite gratuito completado.'}
                </p>
              </>
            )}

            {isPremiumOrAgency && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250/20 px-3 py-1.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                ♾️ Capacidad de Listados Sin Límites
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Panel Content: Tab Switcher & Listing Grids */}
      <div className="lg:col-span-3 space-y-8">
        
        {/* Tab Buttons - Sardo horizontal border */}
        <div className="flex border-b border-stone-200 dark:border-stone-800">
          <button
            onClick={() => setActiveTab('my-listings')}
            className={`flex items-center gap-2 pb-4 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'my-listings'
                ? 'border-primary text-primary'
                : 'border-transparent text-stone-450 hover:text-stone-750 dark:hover:text-stone-200'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Mis Anuncios ({myProperties.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 pb-4 px-6 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'border-primary text-primary'
                : 'border-transparent text-stone-450 hover:text-stone-750 dark:hover:text-stone-200'
            }`}
          >
            <Heart className="h-4.5 w-4.5" />
            <span>Favoritos ({favorites.length})</span>
          </button>
        </div>

        {/* TAB 1: Mis Anuncios */}
        {activeTab === 'my-listings' && (
          <div className="space-y-4 animate-fadeIn">
            {myProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-card-bg border border-dashed border-card-border rounded-xl">
                <PlusCircle className="h-10 w-10 text-stone-350 mb-3 animate-pulse" />
                <h3 className="font-display font-bold text-lg text-stone-800 dark:text-stone-250">No tiene anuncios publicados</h3>
                <p className="text-xs text-stone-450 mt-1 mb-6">
                  Publique su inmueble en Costa Rica gratis hoy mismo. ¡Es rápido, seguro y verificado por OTP!
                </p>
                <Link
                  href="/publicar"
                  className="btn-primary py-2.5 px-5 text-xs shadow-sm"
                >
                  Publicar Primer Anuncio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myProperties.map((prop) => {
                  const isActive = prop.status === 'active';
                  const isPending = prop.status === 'pending';

                  return (
                    <div
                      key={prop.id}
                      className="group relative flex flex-col overflow-hidden rounded-xl border border-card-border bg-card-bg shadow-sm hover:border-card-border transition-all duration-300 hover:shadow-md"
                    >
                      {/* Image cover with state indicator overlay */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100 dark:bg-stone-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prop.imageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'}
                          alt={prop.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                        />

                        {/* Status tag */}
                        <span className={`absolute top-4 left-4 z-10 rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md ${
                          isActive
                            ? 'bg-emerald-600'
                            : isPending
                            ? 'bg-amber-600'
                            : prop.status === 'archived'
                            ? 'bg-stone-500'
                            : 'bg-red-600'
                        }`}>
                          {isActive ? 'Activo' : isPending ? 'En Moderación' : prop.status === 'archived' ? 'Pausado' : 'Rechazado'}
                        </span>

                        {/* Featured active badge on image */}
                        {prop.featured && (
                          <span className="absolute top-4 right-4 z-10 rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md bg-gradient-to-r from-amber-500 to-yellow-500 animate-pulse flex items-center gap-1.5 border border-amber-400">
                            <Sparkles className="h-3 w-3" />
                            <span>Destacado</span>
                          </span>
                        )}

                        {/* Featured pending badge on image */}
                        {prop.isFeaturedPending && (
                          <span className="absolute top-4 right-4 z-10 rounded px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-900 shadow-md bg-yellow-400 flex items-center gap-1">
                            <Zap className="h-3 w-3 animate-spin text-amber-800" />
                            <span>Pendiente SINPE</span>
                          </span>
                        )}
                      </div>

                      {/* Info & Admin Controls */}
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="font-display font-bold text-base text-stone-850 dark:text-stone-100 line-clamp-1 mb-1">
                          {prop.title}
                        </h3>
                        <p className="text-[10px] font-bold uppercase text-stone-400 mb-4">{prop.province}</p>
                        
                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-450 mb-5 font-display tracking-tight">
                          {prop.currency === 'CRC' ? '₡' : '$'}{prop.price.toLocaleString()}
                        </div>

                        {/* Telemetry Metrics Bar */}
                        <div className="grid grid-cols-2 gap-3 mb-5 py-2 px-3 bg-stone-50 dark:bg-stone-900/30 rounded-xl text-stone-600 dark:text-stone-350 text-[10px] font-extrabold uppercase tracking-wider border border-stone-200/10 dark:border-stone-850/40">
                          <div className="flex items-center gap-1.5 justify-center" title="Visitas totales del anuncio">
                            <span>👁️</span>
                            <span>{prop.viewsCount || 0} {prop.viewsCount === 1 ? 'Vista' : 'Vistas'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 justify-center border-l border-stone-200 dark:border-stone-800" title="Clics totales en contactar por WhatsApp">
                            <span>💬</span>
                            <span>{prop.whatsappClicksCount || 0} {prop.whatsappClicksCount === 1 ? 'WhatsApp' : 'WhatsApps'}</span>
                          </div>
                        </div>

                        {/* Action buttons with high visual separation */}
                        <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-850 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
                            <Link
                              href={`/propiedad/${prop.slug}`}
                              className="inline-flex items-center gap-1 text-[10px] font-black text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 uppercase tracking-wider"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Ver</span>
                            </Link>

                            <Link
                              href={`/dashboard/editar/${prop.id}`}
                              className="inline-flex items-center gap-1 text-[10px] font-black text-stone-500 hover:text-stone-850 dark:hover:text-stone-200 uppercase tracking-wider"
                              title="Editar anuncio"
                            >
                              <span>Editar ✏️</span>
                            </Link>

                            {/* Pause/Reactivate toggler */}
                            {isActive && (
                              <button
                                onClick={() => handleToggleStatus(prop.id, 'active')}
                                disabled={statusUpdatingId === prop.id}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 hover:text-stone-850 dark:hover:text-stone-200 uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                title="Pausar anuncio"
                              >
                                <span>Pausar ⏸️</span>
                              </button>
                            )}

                            {prop.status === 'archived' && (
                              <button
                                onClick={() => handleToggleStatus(prop.id, 'archived')}
                                disabled={statusUpdatingId === prop.id}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-350 uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                title="Reactivar anuncio"
                              >
                                <span>Activar ▶️</span>
                              </button>
                            )}

                            {/* Destacar CTA */}
                            {!prop.featured && !prop.isFeaturedPending && isActive && (
                              <Link
                                  href={`/dashboard/destacar/${prop.id}`}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 hover:scale-102 transition-transform uppercase tracking-wider"
                              >
                                <Sparkles className="h-3.5 w-3.5 animate-pulse text-amber-500" />
                                <span>Destacar</span>
                              </Link>
                            )}

                            {prop.featured && (
                              <div className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200/50">
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                <span>Destacado Activo</span>
                              </div>
                            )}

                            {prop.isFeaturedPending && (
                              <div className="text-[9px] font-black text-yellow-700 dark:text-yellow-450 uppercase tracking-wider flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/10 px-2 py-0.5 rounded border border-yellow-350/50">
                                <Zap className="h-3 w-3 text-yellow-600" />
                                <span>SINPE en Revisión</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleDelete(prop.id)}
                            disabled={deletingId === prop.id}
                            className="btn-danger py-1.5 px-3 text-[10px] inline-flex items-center gap-1 hover:scale-102 cursor-pointer transition-all disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{deletingId === prop.id ? 'Eliminando...' : 'Eliminar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Favoritos */}
        {activeTab === 'favorites' && (
          <div className="space-y-4 animate-fadeIn">
            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 bg-card-bg border border-dashed border-card-border rounded-xl">
                <Heart className="h-10 w-10 text-stone-350 mb-3" />
                <h3 className="font-display font-bold text-lg text-stone-800 dark:text-stone-200">No tiene favoritos guardados</h3>
                <p className="text-xs text-stone-450 mt-1 mb-6">
                  Navegue por las propiedades de Costa Rica y marque con un corazón sus opciones predilectas para visualizarlas aquí.
                </p>
                <Link
                  href="/comprar"
                  className="btn-primary py-2.5 px-5 text-xs shadow-sm inline-flex items-center gap-1.5"
                >
                  <Compass className="h-4.5 w-4.5" />
                  <span>Explorar Propiedades</span>
                </Link>
              </div>
            ) : loadingFavs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                <div className="h-80 bg-stone-100 dark:bg-stone-800 rounded-xl" />
                <div className="h-80 bg-stone-100 dark:bg-stone-800 rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favProperties.map((prop) => (
                  <PropertyCard
                    key={prop.id}
                    property={{
                      id: prop.id,
                      type: prop.type,
                      propertyType: prop.propertyType,
                      title: prop.title,
                      slug: prop.slug,
                      price: prop.price,
                      currency: prop.currency,
                      province: prop.province,
                      canton: prop.canton,
                      bedrooms: prop.bedrooms,
                      bathrooms: prop.bathrooms,
                      parkingSpaces: prop.parkingSpaces,
                      petsAllowed: prop.petsAllowed,
                      featured: prop.featured,
                      verified: prop.verified,
                      imageUrl: prop.images?.[0]?.url,
                      contactPhone: prop.contactPhone,
                      whatsapp: prop.whatsapp,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
