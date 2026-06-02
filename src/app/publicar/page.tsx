'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { sendOtp, verifyOtp } from '@/app/actions/otp';
import { createPropertyAction, PropertySubmitData, getUserPropertiesCountAction } from '@/app/actions/properties';
import { groupFeaturesByCategory, FEATURE_CATEGORIES, MASTER_FEATURES } from '@/lib/attributes';
import {
  Sparkles,
  Camera,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Phone,
  HelpCircle,
  UploadCloud,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Mail,
  Send,
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

export default function PublicarPage() {
  const router = useRouter();
  const { user, login, showToast, phoneVerified, verifyPhoneInSession, refreshSession } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  interface PublicarFormState {
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

  const [formData, setFormData] = useState<PublicarFormState>({
    type: 'rent',
    propertyType: 'house',
    title: '',
    description: '',
    price: '',
    currency: 'CRC',
    province: 'San José',
    bedrooms: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    areaM2: '',
    petsAllowed: false,
    furnished: false,
    condominium: false,
    contactPhone: '',
    whatsapp: '',
    imageUrls: [],
    features: [],
  });

  const getStep2Texts = () => {
    switch (formData.propertyType) {
      case 'lot':
        return {
          title: 'Describí las dimensiones y entorno de tu lote',
          description: 'Compartí los detalles que hacen único a este terreno: su topografía, acceso a servicios públicos, vistas y entorno natural.',
          placeholderTitle: 'Ej: Excelente lote plano listo para construir, San Isidro de Heredia',
          placeholderDesc: 'Describa brevemente la topografía del lote, disponibilidad de servicios públicos, uso de suelo, accesos y conveniencia de la zona...'
        };
      case 'commercial':
        return {
          title: 'Describí los detalles de tu local o bodega',
          description: 'Compartí las especificaciones del inmueble comercial: su visibilidad, capacidad de carga, accesos, baños, parqueos y potencial de negocio.',
          placeholderTitle: 'Ej: Amplio local comercial con excelente punto comercial, Barrio Escalante',
          placeholderDesc: 'Describa brevemente la distribución del local, facilidades de parqueo para clientes, seguridad de la bodega y conveniencia del punto...'
        };
      default:
        return {
          title: 'Describí los rincones de tu hogar',
          description: 'Compartí los detalles que hacen único a este espacio: su distribución, entorno natural y calidez.',
          placeholderTitle: 'Ej: Hermoso apartamento con jardín privado, Curridabat',
          placeholderDesc: 'Describa brevemente las ventajas de la propiedad, amenidades y conveniencia de la zona...'
        };
    }
  };

  const step2Texts = getStep2Texts();

  // Client compression state
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  // Features display state
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const handleToggleFeature = (key: string) => {
    const current = formData.features || [];
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    setFormData((prev) => ({ ...prev, features: next }));
  };

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [devOtpLog, setDevOtpLog] = useState<string | null>(null); // Dev helper drawer
  const [isSubmittingProperty, setIsSubmittingProperty] = useState(false);

  // Email verification state variables for testing
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailVerificationLink, setEmailVerificationLink] = useState<string | null>(null);

  // Email OTP state variables
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [devEmailOtpLog, setDevEmailOtpLog] = useState<string | null>(null);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  // Limits and subscription states
  const [loadingLimit, setLoadingLimit] = useState(true);
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [userRole, setUserRole] = useState('USER');
  const [userPlanType, setUserPlanType] = useState('FREE');

  // Load user properties count and role
  useEffect(() => {
    if (user) {
      refreshSession().catch((err) => console.error('Error refreshing session on mount:', err));
    }
  }, []);

  useEffect(() => {
    if (user) {
      setLoadingLimit(true);
      getUserPropertiesCountAction()
        .then((res) => {
          if (res.success) {
            setPropertiesCount(res.count);
            setUserRole(res.role);
            setUserPlanType(res.planType || 'FREE');
          }
          setLoadingLimit(false);
        })
        .catch((err) => {
          console.error('Error fetching property count', err);
          setLoadingLimit(false);
        });
    } else {
      setLoadingLimit(false);
    }
  }, [user]);

  // 1. Auto-save / Load state
  useEffect(() => {
    const saved = localStorage.getItem('draft_property');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (e) {
        console.error('Error loading draft', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('draft_property', JSON.stringify(formData));
  }, [formData]);

  // Clean numerical specs contextually based on property type selected (Sanitize lot/commercial properties)
  useEffect(() => {
    if (formData.propertyType === 'lot') {
      setFormData((prev) => ({
        ...prev,
        bedrooms: 0,
        bathrooms: 0,
        parkingSpaces: 0,
      }));
    } else if (formData.propertyType === 'commercial') {
      setFormData((prev) => ({
        ...prev,
        bedrooms: 0,
      }));
    }
  }, [formData.propertyType]);

  useEffect(() => {
    if (phoneVerified) {
      setFormData((prev) => ({
        ...prev,
        contactPhone: phoneVerified,
        whatsapp: phoneVerified,
      }));
    }
  }, [phoneVerified]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      finalValue = value === '' ? '' : (parseFloat(value) || 0);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  // Sync whatsapp when contact phone changes
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Numeric only
    setFormData((prev) => ({
      ...prev,
      contactPhone: val,
      whatsapp: val, // Keep them identical by default
    }));
  };

  // 2. Client-side Image compression & resizing (HTML5 Canvas)
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Optimized resize constraints to keep Next.js Server Action payloads extremely compact (under 4.5MB Vercel limit)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
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

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string); // Fallback to raw base64
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Export compressed image as JPEG Base64 with highly efficient 0.65 quality (visually premium but 8x smaller!)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          resolve(compressedBase64);
        };
        img.onerror = () => {
          reject(new Error('Failed to load image file.'));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImages = formData.imageUrls || [];
    const remainingSlots = 15 - currentImages.length;
    if (remainingSlots <= 0) {
      showToast('Ya has cargado el máximo de 15 fotografías permitidas.', 'error');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setCompressing(true);
    setCompressionProgress(0);

    const compressedStrings: string[] = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      try {
        const compressed = await processImage(filesToUpload[i]);
        compressedStrings.push(compressed);
      } catch (err) {
        console.error('Error compressing file', err);
        showToast('Error al procesar la imagen.', 'error');
      }
      setCompressionProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
    }

    setFormData((prev) => ({
      ...prev,
      imageUrls: [...(prev.imageUrls || []), ...compressedStrings],
    }));

    setCompressing(false);
    showToast(`Se cargaron y optimizaron ${compressedStrings.length} imágenes.`, 'success');
  };

  const removeImage = (idx: number) => {
    const nextImages = (formData.imageUrls || []).filter((_, i) => i !== idx);
    setFormData({ ...formData, imageUrls: nextImages });
    showToast('Imagen eliminada de la secuencia.', 'info');
  };

  const moveImage = (idx: number, direction: 'prev' | 'next') => {
    const list = [...(formData.imageUrls || [])];
    const targetIdx = direction === 'prev' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Swap elements
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    setFormData({ ...formData, imageUrls: list });
  };

  const setAsCover = (idx: number) => {
    const list = [...(formData.imageUrls || [])];
    if (idx <= 0 || idx >= list.length) return;

    // Remove element and put it at index 0
    const [target] = list.splice(idx, 1);
    list.unshift(target);

    setFormData({ ...formData, imageUrls: list });
    showToast('Imagen establecida como portada principal.', 'success');
  };

  // 3. Step validation
  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (Number(formData.price) <= 0) {
        showToast('Por favor introduce un precio de salida válido superior a cero.', 'error');
        return false;
      }
      return true;
    }
    if (s === 2) {
      if (!formData.title || formData.title.trim().length < 10) {
        showToast('El título del anuncio debe tener al menos 10 caracteres para ser descriptivo.', 'error');
        return false;
      }
      if (!formData.description || formData.description.trim().length < 30) {
        showToast('La descripción detallada debe tener al menos 30 caracteres para informar correctamente.', 'error');
        return false;
      }
      if (Number(formData.areaM2) <= 0) {
        showToast('Por favor introduzca el área en metros cuadrados de la propiedad.', 'error');
        return false;
      }
      return true;
    }
    if (s === 3) {
      if (!formData.imageUrls || formData.imageUrls.length === 0) {
        showToast('Es obligatorio subir al menos 1 foto real para publicar el anuncio.', 'error');
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  // 4. Request simulated WhatsApp OTP
  const handleRequestOtp = async () => {
    if (!formData.contactPhone || formData.contactPhone.length < 8) {
      showToast('Por favor introduce un número de teléfono móvil válido antes de solicitar el código.', 'error');
      return;
    }

    setSendingOtp(true);
    setDevOtpLog(null);

    const res = await sendOtp(formData.contactPhone);
    setSendingOtp(false);

    if (res.success) {
      showToast(res.message, 'success');
      if (res.codeForDev) {
        // Show console log block in UI
        setDevOtpLog(res.codeForDev);
      }
    } else {
      showToast(res.message, 'error');
    }
  };

  // 5. Verify simulated OTP
  const handleVerifyOtpSubmit = async () => {
    if (otpCode.length < 6) {
      showToast('Por favor introduce el código OTP completo de 6 dígitos.', 'error');
      return;
    }

    setVerifyingOtp(true);
    const res = await verifyOtp(formData.contactPhone, otpCode);
    setVerifyingOtp(false);

    if (res.success) {
      showToast(res.message, 'success');
      verifyPhoneInSession(formData.contactPhone); // Sync session locally and cookie
      setStep(1); // Begin the publishing wizard from Step 1 since they are now verified
    } else {
      showToast(res.message, 'error');
    }
  };

  // 5.5. Request simulated/real Email OTP code
  const handleRequestEmailOtp = async () => {
    setSendingEmailOtp(true);
    setDevEmailOtpLog(null);
    try {
      const { sendEmailOtpAction } = await import('@/app/actions/emailOtp');
      const res = await sendEmailOtpAction(user?.email || '');
      setSendingEmailOtp(false);
      if (res.success) {
        showToast(res.message, 'success');
        setEmailOtpSent(true);
        if (res.codeForDev) {
          setDevEmailOtpLog(res.codeForDev);
        }
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      console.error(err);
      setSendingEmailOtp(false);
      showToast('Error al solicitar el código OTP por correo.', 'error');
    }
  };

  // 5.6. Verify Email OTP code
  const handleVerifyEmailOtpSubmit = async () => {
    if (emailOtpCode.length < 6) {
      showToast('Por favor introduce el código OTP completo de 6 dígitos.', 'error');
      return;
    }

    setVerifyingEmailOtp(true);
    try {
      const { verifyEmailOtpAction } = await import('@/app/actions/emailOtp');
      const res = await verifyEmailOtpAction(user?.email || '', emailOtpCode);
      setVerifyingEmailOtp(false);
      if (res.success) {
        showToast(res.message, 'success');
        // Update session client side
        await fetch('/api/auth/session');
        window.location.reload(); // Hard reload to hydrate the verified state cleanly
      } else {
        showToast(res.message, 'error');
      }
    } catch (err) {
      console.error(err);
      setVerifyingEmailOtp(false);
      showToast('Error al verificar el código OTP.', 'error');
    }
  };

  // 6. Complete publication submit
  const handlePublishProperty = async () => {
    // Double check user session
    if (!user) {
      showToast('Debes estar registrado e iniciar sesión para publicar.', 'error');
      router.push('/login');
      return;
    }

    const cleanPhone = (formData.contactPhone || '').replace(/\D/g, '').slice(-8);
    if (cleanPhone.length !== 8) {
      showToast('Debe ingresar un número de teléfono celular de 8 dígitos para publicar.', 'error');
      return;
    }

    setIsSubmittingProperty(true);

    // Call publish Server Action
    const res = await createPropertyAction({
      ...formData,
      price: Number(formData.price) || 0,
      areaM2: Number(formData.areaM2) || 0,
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      parkingSpaces: Number(formData.parkingSpaces) || 0,
    } as PropertySubmitData);

    setIsSubmittingProperty(false);

    if (res.success) {
      showToast(res.message, 'success');
      localStorage.removeItem('draft_property'); // Clear auto-saved draft
      router.push(`/propiedad/${res.slug}`);
    } else {
      showToast(res.message, 'error');
    }
  };

  if (loadingLimit) {
    return (
      <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-20 flex flex-col items-center justify-center animate-fadeIn">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-850 dark:border-stone-800 dark:border-t-white" />
          <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">Verificando suscripción...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-20 flex items-center justify-center animate-fadeIn">
        <div className="max-w-md w-full px-6 text-center">
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-8 shadow-sm space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-850 text-stone-750 dark:text-stone-200 border border-stone-200/40 dark:border-stone-800">
              <KeyRound className="h-6 w-6 text-stone-500 dark:text-stone-400" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Registro Requerido</h2>
              <p className="text-xs text-stone-550 dark:text-stone-400 font-bold leading-relaxed">
                Para garantizar la seguridad, legitimidad y seriedad del marketplace, debes tener una cuenta en la plataforma antes de publicar propiedades.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link
                href="/login"
                className="btn-primary py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm w-full"
              >
                <span>Iniciar Sesión</span>
              </Link>
              <Link
                href="/registro"
                className="btn-secondary py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm w-full"
              >
                <span>Crear Cuenta Gratis</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user && !user.emailVerified) {
    return (
      <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-20 flex items-center justify-center animate-fadeIn">
        <div className="max-w-md w-full px-6">
          <div className="bg-white dark:bg-stone-900 border border-stone-250/70 dark:border-stone-800 rounded-2xl p-8 shadow-sm space-y-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-350 border border-emerald-250/30 dark:border-emerald-900/30">
              <Mail className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Verificá tu Correo Electrónico</h2>
              <p className="text-xs text-stone-550 dark:text-stone-400 font-semibold leading-relaxed">
                Antes de publicar tu primer espacio en Costa Rica, necesitamos verificar tu identidad. Habilita tu cuenta mediante enlace seguro o código OTP enviado a tu correo:
              </p>
              <div className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-950 p-2 rounded border border-stone-200 dark:border-stone-850 mt-1 max-w-xs mx-auto">
                📧 {user.email}
              </div>
            </div>

            {/* Simulated Email OTP console */}
            {process.env.NODE_ENV !== 'production' && devEmailOtpLog && (
              <div className="border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-stone-700 dark:text-stone-300 rounded-xl p-5 text-xs max-w-sm mx-auto flex flex-col items-center gap-2.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-450 tracking-wider uppercase">
                  <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
                  <span>Email OTP Simulador Bot:</span>
                </div>
                <div className="text-center font-medium">Código OTP transaccional enviado a tu correo:</div>
                <div className="text-2xl font-mono tracking-widest font-black text-stone-950 dark:text-stone-100 bg-white dark:bg-stone-900 px-4.5 py-1.5 rounded border border-stone-200 dark:border-stone-850 shadow-inner mt-1">
                  {devEmailOtpLog}
                </div>
              </div>
            )}

            {/* Simulated Email Link verification console */}
            {process.env.NODE_ENV !== 'production' && emailVerificationLink && (
              <div className="border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-stone-700 dark:text-stone-300 rounded-xl p-5 text-xs max-w-sm mx-auto flex flex-col items-center gap-2.5 shadow-inner">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-450 tracking-wider uppercase">
                  <Sparkles className="h-4 w-4 animate-pulse text-amber-500" />
                  <span>Enlace de Verificación Simulador Bot:</span>
                </div>
                <div className="text-center font-medium">Enlace seguro transaccional (Copia y pega):</div>
                <div className="text-[10px] font-mono select-all break-all text-stone-300 bg-white dark:bg-stone-900 p-2.5 rounded border border-stone-200 dark:border-stone-850 shadow-inner mt-1 w-full text-left">
                  {emailVerificationLink}
                </div>
              </div>
            )}

            {/* Main Validation Options */}
            <div className="space-y-4 pt-2">

              {/* Option A: Click Validation Link */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    setSendingEmail(true);
                    const { sendEmailVerification } = await import('@/app/actions/emailVerification');
                    const res = await sendEmailVerification();
                    setSendingEmail(false);
                    if (res.success) {
                      showToast(res.message, 'success');
                      if (res.verificationLink) {
                        setEmailVerificationLink(res.verificationLink);
                      }
                    } else {
                      showToast(res.message, 'error');
                    }
                  }}
                  disabled={sendingEmail}
                  className="btn-primary w-full py-3.5 text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {sendingEmail ? 'Enviando...' : 'Recibir Enlace de Verificación'}
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-stone-250/30 dark:border-stone-800"></div>
                <span className="flex-shrink mx-4 text-[9px] font-bold text-stone-400 dark:text-stone-550 uppercase tracking-widest">O valida usando OTP</span>
                <div className="flex-grow border-t border-stone-250/30 dark:border-stone-800"></div>
              </div>

              {/* Option B: Direct 6-Digit Email OTP Verification */}
              <div className="space-y-3.5 text-left">
                {!emailOtpSent ? (
                  <button
                    type="button"
                    onClick={handleRequestEmailOtp}
                    disabled={sendingEmailOtp}
                    className="btn-secondary w-full py-3.5 text-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {sendingEmailOtp ? 'Enviando OTP...' : 'Solicitar Código OTP por Correo'}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Introduce el código OTP de 6 dígitos"
                      value={emailOtpCode}
                      onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="input-premium py-3 text-center font-mono tracking-widest"
                    />

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleRequestEmailOtp}
                        disabled={sendingEmailOtp}
                        className="btn-secondary flex-1 py-3 text-xs cursor-pointer disabled:opacity-50"
                      >
                        Reenviar
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtpSubmit}
                        disabled={verifyingEmailOtp || emailOtpCode.length < 6}
                        className="btn-primary flex-1 py-3 text-xs cursor-pointer disabled:opacity-50"
                      >
                        {verifyingEmailOtp ? 'Verificando...' : 'Verificar OTP'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // Phone verification gate removed — only email verification is required to publish

  if (user && userRole === 'USER' && userPlanType === 'FREE' && propertiesCount >= 3) {
    return (
      <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-20 flex items-center justify-center animate-fadeIn">
        <div className="max-w-md w-full px-6 text-center">
          <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-8 shadow-sm space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-200/30 dark:border-red-900/30">
              <Sparkles className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Límite de Anuncios</h2>
              <p className="text-xs text-stone-550 dark:text-stone-400 font-bold leading-relaxed">
                Has alcanzado el límite máximo de <span className="text-emerald-700 dark:text-emerald-450 font-black">3 anuncios activos o pendientes</span> permitidos en la versión gratuita de TicoHabitat.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-950/40 border border-stone-200/50 dark:border-stone-800 text-left text-[11px] font-bold text-stone-600 dark:text-stone-400 space-y-1.5">
              <p>Para seguir publicando tienes dos opciones:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Ir a tu Panel de Control y archivar o eliminar anuncios antiguos.</li>
                <li>Contactar con nuestro equipo para adquirir un Plan Premium Ilimitado.</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link
                href="/dashboard"
                className="btn-primary py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm w-full"
              >
                <span>Ir a mi Panel de Control</span>
              </Link>
              <a
                href="https://wa.me/50688888888?text=Hola!%20Me%20interesa%20adquirir%20un%20Plan%20Premium%20para%20publicar%20mas%20de%203%20propiedades%20en%20TicoHabitat."
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm w-full"
              >
                <span>Adquirir Plan Premium</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-stone-50/20 dark:bg-stone-950/20 py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">

        {/* Step Indicator Panel - Beautifully Refactored Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3">
            <span>Paso {step} de 4</span>
            <span className="text-primary font-black">{Math.round(((step - 1) / 3) * 100)}% Completado</span>
          </div>

          <div className="h-[3px] w-full bg-stone-200 dark:bg-stone-850 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-4 text-center text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
            <span className={`transition-colors ${step >= 1 ? 'text-primary font-black' : ''}`}>1. Tipo</span>
            <span className={`transition-colors ${step >= 2 ? 'text-primary font-black' : ''}`}>2. Detalles</span>
            <span className={`transition-colors ${step >= 3 ? 'text-primary font-black' : ''}`}>3. Fotos</span>
            <span className={`transition-colors ${step >= 4 ? 'text-primary font-black' : ''}`}>4. Publicar</span>
          </div>
        </div>

        {/* Wizard Container Card */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl p-6 sm:p-8 shadow-sm">

          {/* STEP 1: Basic properties */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Comencemos a preparar tu anuncio</h2>
                <p className="text-xs text-stone-450 mt-1.5 font-semibold">Elegí la modalidad bajo la cual querés listar tu espacio. Conectamos de forma directa, tranquila y transparente.</p>
              </div>

              {/* Giant Transaction Choice Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'rent' })}
                  className={`flex flex-col items-center justify-center p-6.5 rounded-xl border-2 text-center transition-all duration-200 active:scale-[0.985] cursor-pointer ${formData.type === 'rent'
                      ? 'border-primary bg-primary-light/10 dark:bg-primary-light/5 text-stone-900 dark:text-white shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-450 hover:border-stone-300'
                    }`}
                >
                  <span className="font-display font-black text-base">Alquilar</span>
                  <span className="text-[9px] font-bold text-stone-450 dark:text-stone-500 mt-1.5 uppercase tracking-wider">Mensualidad regular</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'buy' })}
                  className={`flex flex-col items-center justify-center p-6.5 rounded-xl border-2 text-center transition-all duration-200 active:scale-[0.985] cursor-pointer ${formData.type === 'buy'
                      ? 'border-primary bg-primary-light/10 dark:bg-primary-light/5 text-stone-900 dark:text-white shadow-sm'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-450 hover:border-stone-300'
                    }`}
                >
                  <span className="font-display font-black text-base">Vender</span>
                  <span className="text-[9px] font-bold text-stone-450 dark:text-stone-500 mt-1.5 uppercase tracking-wider">Traspaso absoluto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Provincia</label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className="input-premium py-3 cursor-pointer"
                  >
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Tipo de Inmueble</label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleChange}
                    className="input-premium py-3 cursor-pointer"
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Moneda</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="input-premium py-3 cursor-pointer"
                  >
                    <option value="CRC">Colones (₡)</option>
                    <option value="USD">Dólares ($)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Precio de Salida</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    placeholder="Monto de venta o mensualidad"
                    onChange={handleChange}
                    className="input-premium py-3"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Title, Description, stats */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">{step2Texts.title}</h2>
                <p className="text-xs text-stone-450 dark:text-stone-500 mt-1.5 font-semibold">{step2Texts.description}</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Título del Anuncio</label>
                <input
                  type="text"
                  name="title"
                  placeholder={step2Texts.placeholderTitle}
                  value={formData.title}
                  onChange={handleChange}
                  className="input-premium py-3"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">Descripción Completa</label>
                <textarea
                  name="description"
                  placeholder={step2Texts.placeholderDesc}
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="input-premium py-3 resize-none"
                />
              </div>

              <div className={`grid ${formData.propertyType === 'lot'
                  ? 'grid-cols-1 max-w-xs mx-auto'
                  : formData.propertyType === 'commercial'
                    ? 'grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-4'
                } gap-3`}>

                {formData.propertyType !== 'lot' && formData.propertyType !== 'commercial' && (
                  <div>
                    <label className="block text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 text-center">Habitaciones</label>
                    <input
                      type="number"
                      name="bedrooms"
                      value={formData.bedrooms ?? ''}
                      onChange={handleChange}
                      className="input-premium py-3 text-center"
                    />
                  </div>
                )}

                {formData.propertyType !== 'lot' && (
                  <div>
                    <label className="block text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 text-center">Baños</label>
                    <input
                      type="number"
                      name="bathrooms"
                      value={formData.bathrooms ?? ''}
                      onChange={handleChange}
                      className="input-premium py-3 text-center"
                    />
                  </div>
                )}

                {formData.propertyType !== 'lot' && (
                  <div>
                    <label className="block text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 text-center">Parqueos</label>
                    <input
                      type="number"
                      name="parkingSpaces"
                      value={formData.parkingSpaces ?? ''}
                      onChange={handleChange}
                      className="input-premium py-3 text-center"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 text-center">Área (m²)</label>
                  <input
                    type="number"
                    name="areaM2"
                    value={formData.areaM2 || ''}
                    onChange={handleChange}
                    className="input-premium py-3 text-center"
                  />
                </div>
              </div>

              {/* Dynamic Contextual Features Section */}
              <div className="border-t border-stone-150 dark:border-stone-800/80 pt-6 mt-6 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-sm text-stone-850 dark:text-stone-150 tracking-tight">Detalles que brindan bienestar</h3>
                  <p className="text-[11px] text-stone-450 dark:text-stone-500 mt-1 font-semibold">Seleccioná las características y amenidades que aportan tranquilidad y calidad de vida.</p>
                </div>

                <div className="space-y-5">
                  {Object.entries(groupFeaturesByCategory(formData.propertyType)).map(([categoryKey, featureList]) => {
                    // Filter features based on isPrimary or showAllFeatures state
                    const visibleFeatures = featureList.filter(f => f.isPrimary || showAllFeatures);

                    if (visibleFeatures.length === 0) return null;

                    return (
                      <div key={categoryKey} className="space-y-2 animate-fadeIn">
                        <h4 className="text-[9px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-550">
                          {FEATURE_CATEGORIES[categoryKey]}
                        </h4>

                        <div className="flex flex-wrap gap-2">
                          {visibleFeatures.map((feat) => {
                            const isChecked = (formData.features || []).includes(feat.key);
                            return (
                              <button
                                key={feat.key}
                                type="button"
                                onClick={() => handleToggleFeature(feat.key)}
                                className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer select-none active:scale-[0.97] ${isChecked
                                    ? 'bg-primary-light/45 border-primary text-primary dark:bg-primary-light/10 shadow-sm'
                                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-650 dark:text-stone-405 hover:border-stone-300'
                                  }`}
                              >
                                {isChecked && <Check className="h-3.5 w-3.5 shrink-0" />}
                                <span>{feat.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show more button if there are secondary features */}
                {((MASTER_FEATURES[formData.propertyType] || MASTER_FEATURES.other).some(f => !f.isPrimary)) && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllFeatures(!showAllFeatures)}
                      className="btn-secondary py-2 px-4 text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <span>{showAllFeatures ? 'Ocultar opciones avanzadas' : 'Ver más opciones avanzadas'}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAllFeatures ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Multiple Images & Contacts */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Fotografías con calma y luz natural</h2>
                <p className="text-xs text-stone-450 dark:text-stone-500 mt-1.5 font-semibold">Mostrá la propiedad tal como es: sus jardines, luz del día e integración con el entorno. Evitá imágenes artificiales.</p>
              </div>

              {/* Multiple Upload Dropzone Area */}
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-250 dark:border-stone-800 hover:border-stone-400 bg-stone-50/40 dark:bg-stone-950/20 hover:bg-stone-55/60 dark:hover:bg-stone-900/60 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 group"
                >
                  <UploadCloud className="h-10 w-10 text-stone-400 group-hover:text-primary transition-colors" />
                  <div className="text-xs font-bold text-stone-750 dark:text-stone-200">
                    Arrastrá y soltá tus imágenes reales aquí, o hacé clic para buscar
                  </div>
                  <div className="text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider">
                    Soporta JPEG, PNG, WebP (Máx. 15 fotos)
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Compression loading state */}
                {compressing && (
                  <div className="bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-4 rounded-xl space-y-2 animate-pulse">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-stone-550">
                      <span>Procesando y Comprimiendo Imágenes...</span>
                      <span>{compressionProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${compressionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Selected files preview and ordered list */}
                {formData.imageUrls && formData.imageUrls.length > 0 && (
                  <div className="space-y-3.5">
                    <h3 className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest">
                      Imágenes Cargadas ({formData.imageUrls.length} de 15)
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {formData.imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-lg overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 aspect-[4/3] group/item shadow-sm"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />

                          {/* Portada indicator */}
                          {idx === 0 ? (
                            <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded shadow">
                              Portada
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAsCover(idx)}
                              className="absolute top-2 left-2 z-10 bg-stone-900/80 hover:bg-stone-950 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded opacity-0 group-hover/item:opacity-100 transition-opacity shadow cursor-pointer"
                            >
                              Establecer Portada
                            </button>
                          )}

                          {/* Delete overlay */}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 z-10 p-1.5 rounded bg-stone-900/85 hover:bg-red-600 text-white shadow hover:scale-105 transition-all cursor-pointer"
                            title="Eliminar foto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Reordering indicators */}
                          <div className="absolute bottom-2 inset-x-2 z-10 flex justify-between gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => moveImage(idx, 'prev')}
                              className="p-1 rounded bg-stone-900/85 text-white hover:bg-stone-950 disabled:opacity-30 cursor-pointer"
                              title="Mover izquierda"
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </button>
                            <span className="text-[9px] font-bold text-white bg-stone-900/85 px-2 py-0.5 rounded flex items-center">
                              {idx + 1}
                            </span>
                            <button
                              type="button"
                              disabled={idx === formData.imageUrls.length - 1}
                              onClick={() => moveImage(idx, 'next')}
                              className="p-1 rounded bg-stone-900/85 text-white hover:bg-stone-950 disabled:opacity-30 cursor-pointer"
                              title="Mover derecha"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Preview & Publish */}
          {step === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">Tu próximo espacio está listo</h2>
                <p className="text-xs text-stone-450 dark:text-stone-500 mt-1.5 font-semibold">Repasá los detalles de tu anuncio. Una vez publicado, transmitirá tranquilidad y calidad de vida.</p>
              </div>

              {/* Minimal preview box - Editorial style */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden bg-stone-50 dark:bg-stone-950/20 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formData.imageUrls?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'}
                  alt={formData.title}
                  className="w-full aspect-[16/10] object-cover"
                />
                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-450 font-display">
                      {formData.currency === 'CRC' ? '₡' : '$'}{formData.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-black bg-stone-950 dark:bg-stone-100 text-white dark:text-stone-900 px-2.5 py-1 rounded uppercase tracking-wider">
                      {formData.type === 'rent' ? 'Alquiler' : 'Venta'}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-stone-850 dark:text-stone-100">{formData.title || 'Propiedad sin título'}</h3>
                  <p className="text-xs text-stone-450 font-bold">{formData.province}</p>

                  <div className="flex items-center gap-3 text-[10px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider border-t border-stone-150 dark:border-stone-800/40 pt-3">
                    {formData.propertyType !== 'lot' && formData.propertyType !== 'commercial' && (
                      <>
                        <span>{formData.bedrooms} hab</span>
                        <span>•</span>
                      </>
                    )}
                    {formData.propertyType !== 'lot' && (
                      <>
                        <span>{formData.bathrooms} {formData.bathrooms === 1 ? 'baño' : 'baños'}</span>
                        <span>•</span>
                      </>
                    )}
                    {formData.propertyType !== 'lot' && (
                      <>
                        <span>{formData.parkingSpaces} parq</span>
                        <span>•</span>
                      </>
                    )}
                    <span>{formData.areaM2} m²</span>
                  </div>
                </div>
              </div>

              {/* Contact Phone Display - Premium & Read Only */}
              <div className="bg-stone-50/40 dark:bg-stone-950/40 border border-stone-200/80 dark:border-stone-800 rounded-xl p-5 space-y-3">
                <div>
                  <h4 className="font-display font-bold text-xs uppercase tracking-wider text-stone-700 dark:text-stone-300">Información de Contacto</h4>
                  <p className="text-[10px] text-stone-450 dark:text-stone-500 mt-1 font-semibold">El anuncio se enlazará a tu número de teléfono registrado. Para cambiarlo, debes contactar a soporte.</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-stone-900 px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-800">
                  <Phone className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-500" />
                  <span className="text-xs font-mono font-bold tracking-wider text-stone-850 dark:text-stone-100">
                    {phoneVerified || formData.contactPhone || 'No registrado'}
                  </span>
                  <span className="ml-auto text-[9px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-250/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded uppercase tracking-wider">
                    Verificado y Enlazado
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-350 flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>Cuenta verificada de forma segura. El anuncio se listará de inmediato.</span>
              </div>

              <button
                type="button"
                onClick={handlePublishProperty}
                disabled={isSubmittingProperty}
                className="btn-whatsapp py-4 w-full text-sm font-black flex items-center justify-center gap-2 shadow cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                <span>{isSubmittingProperty ? 'Publicando...' : 'Publicar Anuncio Inmobiliario'}</span>
              </button>
            </div>
          )}

          {/* Action Footer Navigation buttons */}
          <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800/80 pt-5 mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary py-2.5 px-4 text-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.985] transition-all duration-200"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
                <span>Atrás</span>
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary py-2.5 px-5 text-xs flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.985] transition-all duration-200"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            ) : (
              <div />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
