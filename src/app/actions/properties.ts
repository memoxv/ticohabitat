'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { checkForDuplicates } from '@/lib/spamDetector';
import { trackMetric } from '@/lib/properties';
import { revalidatePath } from 'next/cache';
import { validateFeaturesForType } from '@/lib/attributes';
import { generateSecureRandomHash } from '@/lib/auth';
import { getUserEffectivePlan } from '@/lib/planInheritance';
import { logSystemError } from '@/lib/logger';

/**
 * Utility to revalidate all affected paths when a property changes state.
 * This guarantees that counts and search results remain perfectly accurate across all devices.
 */
export async function revalidatePropertyPaths({
  provinces = [],
  propertySlug,
}: {
  provinces?: string[];
  propertySlug?: string;
}) {
  // Always clear main landing and indexing paths
  revalidatePath('/');
  revalidatePath('/comprar');
  revalidatePath('/alquilar');
  revalidatePath('/dashboard');
  revalidatePath('/admin');
  revalidatePath('/admin/monetizacion');

  for (const province of provinces) {
    if (!province) continue;
    const slug = province
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ /g, '-');
    revalidatePath(`/comprar/${slug}`);
    revalidatePath(`/alquilar/${slug}`);
  }

  if (propertySlug) {
    revalidatePath(`/propiedad/${propertySlug}`);
  }
}

export interface PropertySubmitData {
  type: 'buy' | 'rent';
  propertyType: 'house' | 'apartment' | 'lot' | 'commercial' | 'quinta' | 'beach' | 'other';
  title: string;
  description: string;
  price: number;
  currency: 'CRC' | 'USD';
  province: 'San José' | 'Alajuela' | 'Heredia' | 'Cartago' | 'Guanacaste' | 'Puntarenas' | 'Limón';
  canton?: string;
  district?: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  areaM2: number;
  petsAllowed: boolean;
  furnished: boolean;
  condominium: boolean;
  contactPhone: string;
  whatsapp: string;
  imageUrls: string[];
  features?: string[];
}

export async function createPropertyAction(data: PropertySubmitData) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: 'Debe iniciar sesión para publicar una propiedad.' };
    }

    // Enforce at least 1 image on server
    if (!data || !data.imageUrls || data.imageUrls.length === 0) {
      return { success: false, message: 'Debe incluir al menos 1 fotografía obligatoria para publicar la propiedad.' };
    }

    const { contactPhone } = data;
    // 0. Defensive: Ensure the session user exists in the database to prevent foreign key errors (P2003) from legacy session cookies!
    let dbUser = await db.user.findUnique({
      where: { id: session.userId },
    });

    // If not found by ID, check if they exist by email to avoid unique constraint crashes (P2002)!
    if (!dbUser && session.email) {
      dbUser = await db.user.findUnique({
        where: { email: session.email },
      });
    }

    if (!dbUser) {
      dbUser = await db.user.create({
        data: {
          id: session.userId,
          email: session.email,
          name: session.name || 'Usuario TicoHabitat',
          password: await generateSecureRandomHash(),
          role: session.role || 'USER',
        },
      });
      console.log(`[Self-Healing] Created legacy session user in DB: ${session.email} (${session.userId})`);
    }

    // 0.6. Enforce account name sync with database
    if (session.name) {
      const isDefaultName = !dbUser.name || dbUser.name === 'Usuario Costa Rica' || dbUser.name === 'Usuario TicoHabitat';
      if (dbUser.name !== session.name || isDefaultName) {
        dbUser = await db.user.update({
          where: { id: dbUser.id },
          data: { name: session.name },
        });
        console.log(`[Self-Healing] Updated user name in DB to match session: ${session.name}`);
      }
    }

    const resolvedUserId = dbUser.id;

    // 0.5. Check property limit based on user plan: FREE plan is limited to 3 properties
    const effectivePlan = await getUserEffectivePlan(resolvedUserId);
    if (effectivePlan.planType === 'FREE' && dbUser.role !== 'ADMIN') {
      const activeCount = await db.property.count({
        where: {
          userId: resolvedUserId,
          status: {
            in: ['active', 'pending', 'draft'],
          },
        },
      });

      if (activeCount >= 3) {
        return {
          success: false,
          message: 'Límite de la versión gratuita alcanzado. Adquiere un Plan Premium o Plan Inmobiliaria en el panel para publicar propiedades ilimitadas y destacar tus publicaciones.',
        };
      }
    }

    // 1. Enforce email verification check for publishing properties
    if (!dbUser.emailVerified) {
      return {
        success: false,
        message: `Tu cuenta (${dbUser.email}) no ha sido verificada por correo electrónico. La verificación de correo es obligatoria para publicar.`,
      };
    }

    // CRITICAL: Retrieve the registered phone number directly from the database user record to prevent spoofing
    const userPhone = (dbUser as any)?.phone;
    if (!userPhone) {
      return {
        success: false,
        message: 'Su cuenta no cuenta con un número de teléfono registrado. Por favor contacte al administrador.',
      };
    }

    const cleanDigits = userPhone.replace(/\D/g, '');
    const phoneInput = cleanDigits.slice(-8); // Get last 8 digits (Costa Rican standard)

    if (phoneInput.length !== 8) {
      return {
        success: false,
        message: 'El número de teléfono registrado en su cuenta es inválido. Debe tener exactamente 8 dígitos.',
      };
    }

    // 2. Perform anti-spam check: check listing count and duplicate score
    const duplicateResult = await checkForDuplicates({
      type: data.type,
      propertyType: data.propertyType,
      title: data.title,
      description: data.description,
      price: data.price,
      province: data.province,
      contactPhone: phoneInput,
      whatsapp: phoneInput,
      imageUrls: data.imageUrls,
      userId: resolvedUserId,
    });

    const reasons = duplicateResult.reasons || [];
    const isLimitExceeded = duplicateResult.isSpam && 
      duplicateResult.score === 100 && 
      reasons.length > 0 && 
      reasons[0]?.includes('Límite excedido');

    // Handle limits check (part of checkForDuplicates score=100 limit exceeded)
    if (isLimitExceeded) {
      return {
        success: false,
        message: reasons[0],
      };
    }

    // Determine status: If highly suspicious, mark as pending review, otherwise active
    const status = duplicateResult.isSpam ? 'pending' : 'active';

    // 3. Generate a clean unique slug
    const baseSlug = data.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    const whatsappUrl = `https://wa.me/506${phoneInput}`;

    // Validate and clean features contextual to this property type
    const validatedFeatures = validateFeaturesForType(data.propertyType, data.features || []);
    
    // Map back key features to legacy boolean fields for backward compatibility
    const hasPets = validatedFeatures.includes('permite_mascotas');
    const hasFurnished = validatedFeatures.includes('amueblado');
    const hasCondo = validatedFeatures.includes('en_condominio');

    // 4. Create database transaction to insert property and details
    const property = await db.property.create({
      data: {
        userId: resolvedUserId,
        type: data.type,
        status,
        propertyType: data.propertyType,
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        currency: data.currency,
        province: data.province,
        canton: data.canton || null,
        district: data.district || null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        parkingSpaces: data.parkingSpaces,
        areaM2: data.areaM2,
        petsAllowed: hasPets,
        furnished: hasFurnished,
        condominium: hasCondo,
        features: JSON.stringify(validatedFeatures),
        contactPhone: phoneInput,
        whatsapp: whatsappUrl,
      },
    });

    // Insert Multiple Images in sequence to preserve natural ordering
    const imagesToSave = data.imageUrls && data.imageUrls.length > 0 
      ? data.imageUrls 
      : ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'];

    for (let i = 0; i < imagesToSave.length; i++) {
      await db.propertyImage.create({
        data: {
          propertyId: property.id,
          url: imagesToSave[i],
          phash: duplicateResult.isSpam ? 'dhash_duplicate_match' : 'dhash_fresh_listing',
        },
      });
    }

    // Create fingerprint for anti-spam tracking
    await db.propertyFingerprint.create({
      data: {
        propertyId: property.id,
        titleNorm: data.title.toLowerCase().replace(/[^a-z0-9]/g, ''),
        descNorm: data.description.substring(0, 100).toLowerCase().replace(/[^a-z0-9]/g, ''),
        price: data.price,
        imagesHash: 'dhash_fresh_listing',
      },
    });

    // Record metrics
    await trackMetric('listing_created', property.id, status);
    if (status === 'active') {
      await trackMetric('listing_active', property.id);
    } else {
      await trackMetric('listing_duplicate_flagged', property.id, reasons.join(', '));
    }

    await revalidatePropertyPaths({
      provinces: [data.province],
      propertySlug: property.slug,
    });

    return {
      success: true,
      propertyId: property.id,
      slug: property.slug,
      isFlagged: duplicateResult.isSpam,
      message: duplicateResult.isSpam
        ? 'Tu anuncio fue creado con éxito, pero se detectó posible similitud con otra propiedad y quedó en revisión de moderación. Estará visible pronto.'
        : 'Tu propiedad ha sido publicada y ya está activa en la plataforma.',
    };
  } catch (error) {
    // Log detailed trace securely to the system database log (bitácora)
    const currentSession = await getSession();
    await logSystemError('createPropertyAction', error, {
      userId: currentSession?.userId || 'unknown',
      title: data?.title,
      contactPhone: data?.contactPhone,
    });
    return { success: false, message: 'Ocurrió un error al crear el anuncio inmobiliario.' };
  }
}

export async function deletePropertyAction(propertyId: string) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: 'No autorizado' };
    }

    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return { success: false, message: 'Propiedad no encontrada' };
    }

    // Check ownership or Admin role
    if (property.userId !== session.userId && session.role !== 'ADMIN') {
      return { success: false, message: 'No tienes permiso para eliminar este anuncio.' };
    }

    await db.property.delete({
      where: { id: propertyId },
    });

    await trackMetric('listing_deleted', propertyId);

    await revalidatePropertyPaths({
      provinces: [property.province],
      propertySlug: property.slug,
    });
    return { success: true, message: 'Anuncio eliminado correctamente.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'No se pudo eliminar el anuncio.' };
  }
}

export async function toggleFavoriteAction(propertyId: string) {
  try {
    const session = await getSession();
    if (!session) return { success: false, message: 'Debe iniciar sesión para guardar favoritos.' };

    const existing = await db.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: session.userId,
          propertyId,
        },
      },
    });

    if (existing) {
      await db.favorite.delete({
        where: { id: existing.id },
      });
      return { success: true, isFavorited: false };
    } else {
      await db.favorite.create({
        data: {
          userId: session.userId,
          propertyId,
        },
      });
      await trackMetric('favorite_added', propertyId, session.userId);
      return { success: true, isFavorited: true };
    }
  } catch (e) {
    return { success: false, message: 'Error al cambiar favoritos.' };
  }
}

export async function reportPropertyAction(propertyId: string, reason: string, details?: string) {
  try {
    const session = await getSession();
    await db.report.create({
      data: {
        userId: session?.userId || null,
        propertyId,
        reason,
        details: details || null,
        status: 'pending',
      },
    });

    await trackMetric('report_submitted', propertyId, reason);

    return { success: true, message: 'Tu reporte ha sido enviado a moderación. Agradecemos tu ayuda para mantener limpia la plataforma.' };
  } catch (e) {
    return { success: false, message: 'No se pudo procesar tu reporte.' };
  }
}

// Admin Operations
export async function moderatePropertyAction(propertyId: string, action: 'approve' | 'reject' | 'delete' | 'feature' | 'verify') {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return { success: false, message: 'Acceso denegado: Se requiere rol de Administrador.' };
    }

    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { id: true, slug: true, province: true, featured: true, verified: true }
    });

    if (!property) {
      return { success: false, message: 'La propiedad especificada no existe.' };
    }

    if (action === 'approve') {
      await db.property.update({
        where: { id: propertyId },
        data: { status: 'active' },
      });
      await revalidatePropertyPaths({
        provinces: [property.province],
        propertySlug: property.slug,
      });
      return { success: true, message: 'Propiedad aprobada exitosamente.' };
    }

    if (action === 'reject') {
      await db.property.update({
        where: { id: propertyId },
        data: { status: 'rejected' },
      });
      await revalidatePropertyPaths({
        provinces: [property.province],
        propertySlug: property.slug,
      });
      return { success: true, message: 'Propiedad rechazada.' };
    }

    if (action === 'delete') {
      await db.property.delete({
        where: { id: propertyId },
      });
      await revalidatePropertyPaths({
        provinces: [property.province],
        propertySlug: property.slug,
      });
      return { success: true, message: 'Propiedad eliminada permanentemente.' };
    }

    if (action === 'feature') {
      const nextFeatured = !property.featured;
      // Default to 30 days maximum duration for manual feature toggles, or null if disabling
      const expirationDate = nextFeatured
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

      await db.property.update({
        where: { id: propertyId },
        data: { 
          featured: nextFeatured,
          featuredExpiresAt: expirationDate,
        },
      });
      await revalidatePropertyPaths({
        provinces: [property.province],
        propertySlug: property.slug,
      });
      return { 
        success: true, 
        message: nextFeatured 
          ? 'Anuncio destacado por 30 días.' 
          : 'Destaque removido.' 
      };
    }

    if (action === 'verify') {
      await db.property.update({
        where: { id: propertyId },
        data: { verified: !property.verified },
      });
      await revalidatePropertyPaths({
        provinces: [property.province],
        propertySlug: property.slug,
      });
      return { success: true, message: 'Estado Verificado modificado.' };
    }

    return { success: false, message: 'Acción no válida.' };
  } catch (error) {
    return { success: false, message: 'Error en la moderación del anuncio.' };
  }
}



export async function getUserPropertiesCountAction() {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, count: 0, role: 'USER', planType: 'FREE' };
    }

    let dbUser = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!dbUser && session.email) {
      dbUser = await db.user.findUnique({
        where: { email: session.email },
      });
    }

    if (!dbUser) {
      return { success: true, count: 0, role: 'USER', planType: 'FREE' };
    }

    const count = await db.property.count({
      where: {
        userId: dbUser.id,
        status: {
          in: ['active', 'pending', 'draft'],
        },
      },
    });

    const effectivePlan = await getUserEffectivePlan(dbUser.id);
    return { success: true, count, role: dbUser.role, planType: effectivePlan.planType };
  } catch (e) {
    return { success: false, count: 0, role: 'USER', planType: 'FREE' };
  }
}

export async function togglePropertyActiveStatusAction(propertyId: string, newStatus: 'active' | 'archived') {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: 'No autorizado. Por favor inicie sesión.' };
    }

    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { id: true, userId: true, title: true, status: true, province: true, slug: true }
    });

    if (!property) {
      return { success: false, message: 'La propiedad no existe.' };
    }

    if (property.userId !== session.userId && session.role !== 'ADMIN') {
      return { success: false, message: 'No tienes permisos para modificar este anuncio.' };
    }

    if (newStatus === 'active') {
      // Check publishing limits
      const effectivePlan = await getUserEffectivePlan(session.userId);
      if (effectivePlan.planType === 'FREE' && session.role !== 'ADMIN') {
        const activeCount = await db.property.count({
          where: {
            userId: session.userId,
            status: 'active',
          },
        });

        if (activeCount >= 3) {
          return {
            success: false,
            message: 'Límite del Plan Básico alcanzado. Ya tienes 3 anuncios activos. Pausa o archiva uno de tus anuncios activos primero para poder activar este, o mejora tu plan para publicaciones ilimitadas.',
          };
        }
      }

      await db.property.update({
        where: { id: propertyId },
        data: { status: 'active' },
      });

      await trackMetric('listing_active', propertyId);

      await revalidatePropertyPaths({
        provinces: [property.province],
        propertySlug: property.slug,
      });

      return { success: true, message: 'Tu anuncio ha sido reactivado con éxito y ya es visible al público.' };
    } else {
      // Pause/Archive
      await db.property.update({
        where: { id: propertyId },
        data: { status: 'archived' },
      });

      await trackMetric('listing_deleted', propertyId); // track as inactive

      await revalidatePropertyPaths({
        provinces: [property.province],
        propertySlug: property.slug,
      });

      return { success: true, message: 'Tu anuncio ha sido pausado. Ya no es visible al público, pero permanece guardado en tu panel.' };
    }
  } catch (error) {
    console.error('Error toggling property status:', error);
    return { success: false, message: 'Error interno al cambiar el estado del anuncio.' };
  }
}

export async function updatePropertyAction(propertyId: string, data: PropertySubmitData) {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, message: 'Debe iniciar sesión para editar una propiedad.' };
    }

    if (!data || !data.imageUrls || data.imageUrls.length === 0) {
      return { success: false, message: 'Debe incluir al menos 1 fotografía obligatoria.' };
    }
    // 1. Verify property existence and ownership
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { userId: true, slug: true, province: true },
    });

    if (!property) {
      return { success: false, message: 'La propiedad especificada no existe.' };
    }

    if (property.userId !== session.userId && session.role !== 'ADMIN') {
      return { success: false, message: 'No tiene permisos para modificar esta propiedad.' };
    }

    // Enforce name sync in DB
    if (session.name) {
      const dbUser = await db.user.findUnique({
        where: { id: session.userId },
        select: { name: true }
      });
      if (dbUser) {
        const isDefaultName = !dbUser.name || dbUser.name === 'Usuario Costa Rica' || dbUser.name === 'Usuario TicoHabitat';
        if (dbUser.name !== session.name || isDefaultName) {
          await db.user.update({
            where: { id: session.userId },
            data: { name: session.name },
          });
          console.log(`[Self-Healing] Updated user name in DB to match session during edit: ${session.name}`);
        }
      }
    }

    // CRITICAL: Retrieve the registered phone number directly from the database user record to prevent spoofing
    const dbUserForPhone = await db.user.findUnique({
      where: { id: session.userId },
      select: { phone: true }
    });
    const userPhone = (dbUserForPhone as any)?.phone;
    if (!userPhone) {
      return {
        success: false,
        message: 'Su cuenta no cuenta con un número de teléfono registrado. Por favor contacte al administrador.',
      };
    }

    const cleanDigits = userPhone.replace(/\D/g, '');
    const phoneInput = cleanDigits.slice(-8); // Get last 8 digits (Costa Rican standard)

    if (phoneInput.length !== 8) {
      return {
        success: false,
        message: 'El número de teléfono registrado en su cuenta es inválido. Debe tener exactamente 8 dígitos.',
      };
    }

    const whatsappUrl = `https://wa.me/506${phoneInput}`;

    // 2. Perform database update
    await db.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: propertyId },
        data: {
          type: data.type,
          propertyType: data.propertyType,
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency,
          province: data.province,
          canton: data.canton || null,
          district: data.district || null,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          parkingSpaces: data.parkingSpaces,
          areaM2: data.areaM2,
          petsAllowed: data.petsAllowed,
          furnished: data.furnished,
          condominium: data.condominium,
          contactPhone: phoneInput,
          whatsapp: whatsappUrl,
          features: JSON.stringify(data.features || []),
        },
      });

      // Synchronize image collections (delete old, create new)
      await tx.propertyImage.deleteMany({
        where: { propertyId },
      });

      await tx.propertyImage.createMany({
        data: data.imageUrls.map((url) => ({
          propertyId,
          url,
          phash: 'dhash_fresh_listing',
        })),
      });
    });

    // 3. Clear relevant Next.js router cache paths
    await revalidatePropertyPaths({
      provinces: [property.province, data.province],
      propertySlug: property.slug,
    });

    return { success: true, message: '¡Tu anuncio ha sido actualizado con éxito!' };
  } catch (error) {
    // Log detailed trace securely to the system database log (bitácora)
    const currentSession = await getSession();
    await logSystemError('updatePropertyAction', error, {
      userId: currentSession?.userId || 'unknown',
      propertyId,
      title: data?.title,
    });
    return { success: false, message: 'Error interno al intentar guardar los cambios.' };
  }
}

