'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { updatePropertyAction, PropertySubmitData } from '@/app/actions/properties';
import { groupFeaturesByCategory, FEATURE_CATEGORIES } from '@/lib/attributes';
import {
  Sparkles,
  Camera,
  CheckCircle2,
  Phone,
  UploadCloud,
  Trash2,
  ArrowLeft,
  Check,
  ChevronDown,
  Building2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const PROVINCES = ['San José', 'Alajuela', 'Heredia', 'Cartago', 'Guanacaste', 'Puntarenas', 'Limón'];
const PROPERTY_TYPES = [
  { value: 'house', label: 'Casa' },
  { value: 'apartment', label: 'Apartamento' },
  { value: 'lot', label: 'Lote / Terreno' },
  { value: 'commercial', label: 'Local Comercial / Bodega' },
  { value: 'quinta', label: 'Quinta / Finca' },
  { value: 'beach', label: 'Casa de Playa / Vacacional' },
  { value: 'other', label: 'Otro' },
];

interface EditPropertyFormProps {
  property: {
    id: string;
    type: string;
    propertyType: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    province: string;
    canton?: string | null;
    district?: string | null;
    bedrooms: number;
    bathrooms: number;
    parkingSpaces: number;
    areaM2: number;
    petsAllowed: boolean;
    furnished: boolean;
    condominium: boolean;
    contactPhone: string;
    whatsapp: string;
    features: string; // JSON string
    images: { url: string }[];
  };
}

export default function EditPropertyForm({ property }: EditPropertyFormProps) {
  const router = useRouter();
  const { showToast, phoneVerified, verifyPhoneInSession } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // OTP states for phone verification inside the edit form (if user has no verified phone yet)
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [devOtpLog, setDevOtpLog] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    if (!formData.contactPhone || formData.contactPhone.length < 8) {
      showToast('Por favor introduce un número de teléfono móvil válido antes de solicitar el código.', 'error');
      return;
    }

    setSendingOtp(true);
    setDevOtpLog(null);

    const { sendOtp } = await import('@/app/actions/otp');
    const res = await sendOtp(formData.contactPhone);
    setSendingOtp(false);

    if (res.success) {
      showToast(res.message, 'success');
      if (res.codeForDev) {
        setDevOtpLog(res.codeForDev);
      }
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleVerifyOtpSubmit = async () => {
    if (otpCode.length < 6) {
      showToast('Por favor introduce el código OTP completo de 6 dígitos.', 'error');
      return;
    }

    setVerifyingOtp(true);
    const { verifyOtp } = await import('@/app/actions/otp');
    const res = await verifyOtp(formData.contactPhone, otpCode);
    setVerifyingOtp(false);

    if (res.success) {
      showToast(res.message, 'success');
      verifyPhoneInSession(formData.contactPhone);
      setDevOtpLog(null);
      setOtpCode('');
    } else {
      showToast(res.message, 'error');
    }
  };

  interface EditFormState {
    type: 'buy' | 'rent';
    propertyType: 'house' | 'apartment' | 'lot' | 'commercial' | 'quinta' | 'beach' | 'other';
    title: string;
    description: string;
    price: number | '';
    currency: 'CRC' | 'USD';
    province: 'San José' | 'Alajuela' | 'Heredia' | 'Cartago' | 'Guanacaste' | 'Puntarenas' | 'Limón';
    canton?: string;
    district?: string;
    bedrooms: number | '';
    bathrooms: number | '';
    parkingSpaces: number | '';
    areaM2: number | '';
    petsAllowed: boolean;
    furnished: boolean;
    condominium: boolean;
    contactPhone: string;
    whatsapp: string;
    imageUrls: string[];
    features?: string[];
  }

  // Initialize form state
  const [formData, setFormData] = useState<EditFormState>(() => {
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = JSON.parse(property.features || '[]');
    } catch (e) {
      console.error('Failed to parse property features:', e);
    }

    const initialPhone = phoneVerified || property.contactPhone || '';
    const initialWhatsapp = phoneVerified || property.whatsapp || '';

    return {
      type: property.type as 'buy' | 'rent',
      propertyType: property.propertyType as any,
      title: property.title,
      description: property.description,
      price: property.price,
      currency: property.currency as 'CRC' | 'USD',
      province: property.province as any,
      canton: property.canton || '',
      district: property.district || '',
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      parkingSpaces: property.parkingSpaces,
      areaM2: property.areaM2,
      petsAllowed: property.petsAllowed,
      furnished: property.furnished,
      condominium: property.condominium,
      contactPhone: initialPhone,
      whatsapp: initialWhatsapp,
      imageUrls: property.images.map((img) => img.url),
      features: parsedFeatures,
    };
  });

  // Keep phone number state updated with verified user session phone
  useEffect(() => {
    if (phoneVerified) {
      setFormData((prev) => ({
        ...prev,
        contactPhone: phoneVerified,
        whatsapp: phoneVerified,
      }));
    }
  }, [phoneVerified]);

  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const handleToggleFeature = (key: string) => {
    const current = formData.features || [];
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setFormData((prev) => ({ ...prev, features: next }));
  };

  // Canvas-based image compression at 80% quality (JPEG)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.80);
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = formData.imageUrls || [];
    const remainingSlots = 15 - currentImages.length;
    if (remainingSlots <= 0) {
      showToast('Ya has cargado el máximo de 15 fotografías.', 'error');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setCompressing(true);
    setCompressionProgress(0);

    const compressedStrings: string[] = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const base64 = await compressImage(filesToUpload[i]);
        compressedStrings.push(base64);
        setCompressionProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
      } catch (err) {
        console.error(err);
        showToast('Error al comprimir una de las imágenes.', 'error');
      }
    }

    setFormData((prev) => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), ...compressedStrings],
    }));
    setCompressing(false);
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showToast('El título es obligatorio.', 'error');
      return;
    }
    if (formData.title.length < 10) {
      showToast('El título debe tener al menos 10 caracteres.', 'error');
      return;
    }
    if (!formData.description.trim()) {
      showToast('La descripción es obligatoria.', 'error');
      return;
    }
    if (Number(formData.price) <= 0) {
      showToast('El precio debe ser mayor a cero.', 'error');
      return;
    }
    if (!formData.imageUrls || formData.imageUrls.length === 0) {
      showToast('Debe incluir al menos 1 fotografía obligatoria.', 'error');
      return;
    }
    if (!formData.contactPhone.trim() || formData.contactPhone.length < 8) {
      showToast('El teléfono de contacto debe tener al menos 8 dígitos.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePropertyAction(property.id, {
        ...formData,
        price: Number(formData.price) || 0,
        areaM2: Number(formData.areaM2) || 0,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        parkingSpaces: Number(formData.parkingSpaces) || 0,
      } as PropertySubmitData);
      if (res.success) {
        showToast(res.message, 'success');
        router.push('/dashboard');
        router.refresh();
      } else {
        showToast(res.message || 'Error al guardar los cambios.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error interno al conectar con el servidor.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group current allowed features based on the selected property type
  const featureGroups = groupFeaturesByCategory(formData.propertyType);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-850 pb-5">
        <div>
          <h1 className="font-display text-2xl font-black text-stone-900 dark:text-white flex items-center gap-2">
            <span>Editar Anuncio</span>
          </h1>
          <p className="text-[11px] text-stone-400 mt-1 uppercase tracking-wider font-semibold">
            Modificá los detalles de tu publicación · Grecia, Alajuela
          </p>
        </div>
        <Link
          href="/dashboard"
          className="btn-secondary py-2 px-4 text-xs inline-flex items-center gap-1.5 self-start sm:self-center"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Panel</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column: core stats */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-6 space-y-5 shadow-xs">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-stone-400 dark:text-stone-550">1. Datos Básicos</h3>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'rent' }))}
                className={`py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                  formData.type === 'rent'
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600'
                    : 'border-stone-200 dark:border-stone-800 text-stone-450 hover:bg-stone-50 dark:hover:bg-stone-950'
                }`}
              >
                Alquiler
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, type: 'buy' }))}
                className={`py-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                  formData.type === 'buy'
                    ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600'
                    : 'border-stone-200 dark:border-stone-800 text-stone-450 hover:bg-stone-50 dark:hover:bg-stone-950'
                }`}
              >
                Venta
              </button>
            </div>

            {/* Property Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Tipo de Inmueble</label>
              <div className="relative">
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, propertyType: e.target.value as any }))}
                  className="input-premium py-3 w-full pr-10 appearance-none bg-white dark:bg-stone-900 focus:outline-none"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Título del Anuncio</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Hermosa casa en condominio con jardín privado"
                className="input-premium w-full py-3 text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Descripción Detallada</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describí los rincones, acabados, luz natural y amenidades de tu propiedad..."
                rows={5}
                className="input-premium w-full py-3 text-xs resize-none"
              />
            </div>

            {/* Price & Currency */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Moneda</label>
                <div className="relative">
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value as any }))}
                    className="input-premium py-3 w-full pr-10 appearance-none bg-white dark:bg-stone-900 focus:outline-none"
                  >
                    <option value="CRC">Colones (₡)</option>
                    <option value="USD">Dólares ($)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Precio</label>
                <input
                  type="number"
                  value={formData.price ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) }))}
                  placeholder="Monto"
                  className="input-premium w-full py-3 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-6 space-y-5 shadow-xs">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-stone-400 dark:text-stone-550">2. Ubicación & Dimensiones</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Provincia</label>
                <div className="relative">
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData((prev) => ({ ...prev, province: e.target.value as any }))}
                    className="input-premium py-3 w-full pr-10 appearance-none bg-white dark:bg-stone-900 focus:outline-none"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Cantón</label>
                <input
                  type="text"
                  value={formData.canton}
                  onChange={(e) => setFormData((prev) => ({ ...prev, canton: e.target.value }))}
                  placeholder="Ej: Grecia"
                  className="input-premium w-full py-3 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Distrito</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData((prev) => ({ ...prev, district: e.target.value }))}
                  placeholder="Ej: Tacares"
                  className="input-premium w-full py-3 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Área M²</label>
                <input
                  type="number"
                  value={formData.areaM2 ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, areaM2: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) }))}
                  placeholder="M²"
                  className="input-premium w-full py-3 text-xs"
                />
              </div>
              {formData.propertyType !== 'lot' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Habitaciones</label>
                    <input
                      type="number"
                      value={formData.bedrooms ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) }))}
                      className="input-premium w-full py-3 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Baños</label>
                    <input
                      type="number"
                      value={formData.bathrooms ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bathrooms: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) }))}
                      className="input-premium w-full py-3 text-xs"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500">Parqueos</label>
                <input
                  type="number"
                  value={formData.parkingSpaces ?? ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, parkingSpaces: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) }))}
                  className="input-premium w-full py-3 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Features options */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-6 space-y-5 shadow-xs">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-stone-400 dark:text-stone-550">3. Características Especiales</h3>

            <div className="space-y-6">
              {Object.keys(featureGroups).length === 0 ? (
                <p className="text-xs text-stone-450 dark:text-stone-500 italic">No hay características específicas para este tipo de propiedad.</p>
              ) : (
                Object.entries(featureGroups).map(([catKey, feats]) => {
                  const catLabel = FEATURE_CATEGORIES[catKey] || catKey;
                  const primaryFeats = feats.filter((f) => f.isPrimary || showAllFeatures);

                  if (primaryFeats.length === 0) return null;

                  return (
                    <div key={catKey} className="space-y-2">
                      <h4 className="text-[9.5px] font-black text-stone-400 uppercase tracking-widest">{catLabel}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {feats.map((feat) => {
                          const isSelected = (formData.features || []).includes(feat.key);
                          if (!feat.isPrimary && !showAllFeatures) return null;

                          return (
                            <button
                              key={feat.key}
                              type="button"
                              onClick={() => handleToggleFeature(feat.key)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600'
                                  : 'border-stone-150 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-950 text-stone-600 dark:text-stone-300'
                              }`}
                            >
                              <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                                isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300 dark:border-stone-750'
                              }`}>
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span>{feat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {Object.keys(featureGroups).length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="w-full text-center py-2.5 bg-stone-50 hover:bg-stone-100 dark:bg-stone-950 dark:hover:bg-stone-850 border border-stone-200 dark:border-stone-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-stone-500 dark:text-stone-400 cursor-pointer"
                >
                  {showAllFeatures ? 'Ocultar Opciones Secundarias' : 'Mostrar Todas Las Opciones'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column: images and contact */}
        <div className="space-y-6">
          {/* Photos manager */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-6 space-y-5 shadow-xs">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-stone-400 dark:text-stone-550">4. Fotografías ({formData.imageUrls?.length || 0}/15)</h3>

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 dark:border-stone-800 hover:border-emerald-500/40 rounded-xl p-5 text-center cursor-pointer transition-all bg-stone-50/50 dark:bg-stone-950/20 hover:bg-emerald-500/2"
            >
              <UploadCloud className="h-8 w-8 text-stone-400 dark:text-stone-600 mx-auto mb-2" />
              <div className="text-[10px] font-bold text-stone-600 dark:text-stone-300 uppercase tracking-wider">Añadir Fotos</div>
              <p className="text-[9px] text-stone-450 mt-1 max-w-xxs mx-auto leading-relaxed">Arrastrá tus imágenes o hacé clic para buscar. Máximo 15 fotos.</p>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Compressing Indicator */}
            {compressing && (
              <div className="p-3 bg-stone-950 border border-stone-850 rounded-xl text-center space-y-2">
                <div className="text-[9px] font-extrabold uppercase text-amber-500 tracking-wider">Optimizando imágenes...</div>
                <div className="h-[3px] w-full bg-stone-850 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${compressionProgress}%` }} />
                </div>
              </div>
            )}

            {/* Uploaded images gallery */}
            {formData.imageUrls && formData.imageUrls.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {formData.imageUrls.map((url, i) => (
                  <div key={i} className="group relative aspect-square rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden bg-stone-100 dark:bg-stone-950">
                    <img src={url} alt={`Propiedad ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 p-1 bg-red-650 hover:bg-red-750 text-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-stone-450 dark:text-stone-500 italic text-center py-2">Debe incluir al menos 1 fotografía obligatoria.</p>
            )}
          </div>

          {/* Contact settings */}
          <div className="rounded-xl border border-stone-200 dark:border-stone-850 bg-white dark:bg-stone-900 p-6 space-y-5 shadow-xs">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-stone-400 dark:text-stone-550">5. Información de Contacto</h3>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-550 flex items-center justify-between">
                <span>Teléfono Celular de Contacto</span>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider">✓ Vinculado a tu cuenta</span>
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                disabled
                placeholder="Ej: 88888888"
                className="input-premium w-full py-3 text-xs font-mono opacity-65 bg-stone-100/50 dark:bg-stone-850/30 cursor-not-allowed"
              />
              <p className="text-[9px] text-stone-450 dark:text-stone-550 font-bold leading-relaxed mt-1">
                Por seguridad, el número telefónico está vinculado a tu cuenta. Si deseas cambiarlo, por favor ponte en contacto con el administrador.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-stone-450 dark:text-stone-550">
                WhatsApp (Número Completo)
              </label>
              <input
                type="text"
                value={formData.whatsapp.includes('wa.me') ? formData.whatsapp.split('/').pop()?.replace('506', '') || formData.whatsapp : formData.whatsapp}
                disabled
                placeholder="Ej: 88888888"
                className="input-premium w-full py-3 text-xs opacity-65 bg-stone-100/50 dark:bg-stone-850/30 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          {/* Save buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || compressing}
              className="w-full btn-primary py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98] transition-transform disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>{isSubmitting ? 'Guardando Cambios...' : 'Guardar Cambios 💾'}</span>
            </button>

            <Link
              href="/dashboard"
              className="w-full btn-secondary py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 text-stone-450 dark:text-stone-300"
            >
              <span>Cancelar</span>
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
