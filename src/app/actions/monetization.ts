'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export interface FeaturedTransactionData {
  propertyId: string;
  durationDays: number;
  amount: number;
  receiptBase64: string;
}

export interface PlanTransactionData {
  planType: 'PREMIUM' | 'AGENCY';
  amount: number;
  receiptBase64: string;
  agencyName?: string;
  agencyLogo?: string;
}

export async function createFeaturedTransactionAction(data: FeaturedTransactionData) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Debe iniciar sesión para destacar una publicación.' };
  }

  const { propertyId, durationDays, amount, receiptBase64 } = data;

  try {
    // Verify property exists and belongs to user
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return { success: false, message: 'La propiedad no existe.' };
    }

    if (property.userId !== session.userId && session.role !== 'ADMIN') {
      return { success: false, message: 'No tiene permisos para modificar esta propiedad.' };
    }

    // Verify if there is already a pending featured transaction for this property
    const existingPending = await db.transaction.findFirst({
      where: {
        userId: session.userId,
        referenceId: propertyId,
        type: 'featured_listing',
        status: 'pending',
      },
    });

    if (existingPending) {
      return {
        success: false,
        message: 'Ya hay una solicitud de destaque pendiente para esta propiedad. Por favor, espere a que el administrador la apruebe.',
      };
    }

    // Create SINPE transaction
    await db.transaction.create({
      data: {
        userId: session.userId,
        amount,
        type: 'featured_listing',
        referenceId: propertyId,
        durationDays,
        paymentMethod: 'SINPE',
        receiptUrl: receiptBase64,
        status: 'pending',
      },
    });

    revalidatePath(`/dashboard`);
    revalidatePath(`/propiedad/${property.slug}`);

    return {
      success: true,
      message: 'Su comprobante de SINPE ha sido enviado con éxito. Un administrador lo validará a la brevedad.',
    };
  } catch (error) {
    console.error('Error creating featured transaction:', error);
    return { success: false, message: 'Error interno al procesar el pago manual.' };
  }
}

export async function upgradePlanTransactionAction(data: PlanTransactionData) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Debe iniciar sesión para adquirir un plan premium.' };
  }

  const { planType, amount, receiptBase64, agencyName, agencyLogo } = data;

  try {
    // Server-side price validation: dynamically enforce active promotional rates (valid until June 30th, 2026)
    const isPromoActive = new Date() < new Date('2026-07-01T00:00:00');
    const expectedAmount = planType === 'PREMIUM'
      ? (isPromoActive ? 12500 : 25000)
      : (isPromoActive ? 38500 : 55000);

    if (amount !== expectedAmount) {
      return {
        success: false,
        message: `El monto reportado (₡${amount.toLocaleString()}) no coincide con el precio oficial de este plan (₡${expectedAmount.toLocaleString()}).`,
      };
    }
    // Verify if there is already a pending transaction for this subscription plan
    const existingPending = await db.transaction.findFirst({
      where: {
        userId: session.userId,
        type: planType === 'PREMIUM' ? 'premium_plan' : 'agency_plan',
        status: 'pending',
      },
    });

    if (existingPending) {
      return {
        success: false,
        message: `Ya tienes una solicitud de plan ${planType === 'PREMIUM' ? 'Premium' : 'Inmobiliaria'} pendiente de aprobación.`,
      };
    }

    // Save extra data as notes if it's an agency
    const notesJson = planType === 'AGENCY' && agencyName
      ? JSON.stringify({ agencyName, agencyLogo })
      : null;

    // Create SINPE transaction for plan
    await db.transaction.create({
      data: {
        userId: session.userId,
        amount,
        type: planType === 'PREMIUM' ? 'premium_plan' : 'agency_plan',
        paymentMethod: 'SINPE',
        receiptUrl: receiptBase64,
        status: 'pending',
        notes: notesJson,
      },
    });

    revalidatePath(`/dashboard/planes`);
    revalidatePath(`/dashboard`);

    return {
      success: true,
      message: 'Comprobante de plan enviado. Un administrador activará su suscripción premium en minutos.',
    };
  } catch (error) {
    console.error('Error creating plan transaction:', error);
    return { success: false, message: 'Error al solicitar la suscripción.' };
  }
}

export async function getUserTransactionsAction() {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autorizado', transactions: [] };
  }

  try {
    const transactions = await db.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, transactions };
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return { success: false, message: 'Error al consultar transacciones', transactions: [] };
  }
}

export async function getPropertyFeaturedStatus(propertyId: string) {
  const session = await getSession();
  if (!session) {
    return {
      isPending: false,
      isFeatured: false,
      expiresAt: null,
      planType: 'FREE',
      featuredCount: 0,
      maxFeatured: 0,
      hasFreeSlot: false,
    };
  }

  try {
    const pendingTx = await db.transaction.findFirst({
      where: {
        referenceId: propertyId,
        type: 'featured_listing',
        status: 'pending',
      },
    });

    const activeFeatured = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        userId: true,
        featured: true,
        featuredExpiresAt: true,
      },
    });

    // Get user details
    const dbUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { planType: true },
    });

    const planType = dbUser?.planType || 'FREE';
    const maxFeatured = planType === 'PREMIUM' ? 3 : planType === 'AGENCY' ? 8 : 0;

    // Count currently active featured properties for this user
    const featuredCount = await db.property.count({
      where: {
        userId: session.userId,
        featured: true,
        featuredExpiresAt: {
          gt: new Date(),
        },
      },
    });

    const hasFreeSlot = featuredCount < maxFeatured;

    return {
      isPending: !!pendingTx,
      isFeatured: !!activeFeatured?.featured && (activeFeatured.featuredExpiresAt === null || activeFeatured.featuredExpiresAt > new Date()),
      expiresAt: activeFeatured?.featuredExpiresAt,
      planType,
      featuredCount,
      maxFeatured,
      hasFreeSlot,
    };
  } catch (error) {
    console.error('Error getting property status:', error);
    return {
      isPending: false,
      isFeatured: false,
      expiresAt: null,
      planType: 'FREE',
      featuredCount: 0,
      maxFeatured: 0,
      hasFreeSlot: false,
    };
  }
}

export async function activateFreeFeaturedAction(propertyId: string, durationDays: number) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Debe iniciar sesión para destacar una publicación.' };
  }

  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return { success: false, message: 'La propiedad no existe.' };
    }

    if (property.userId !== session.userId && session.role !== 'ADMIN') {
      return { success: false, message: 'No tiene permisos para modificar esta propiedad.' };
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { planType: true },
    });

    const planType = dbUser?.planType || 'FREE';
    const maxFeatured = planType === 'PREMIUM' ? 3 : planType === 'AGENCY' ? 8 : 0;

    // Count currently active featured properties for this user
    const featuredCount = await db.property.count({
      where: {
        userId: session.userId,
        featured: true,
        featuredExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (featuredCount >= maxFeatured) {
      return {
        success: false,
        message: `Ya has utilizado tu límite de ${maxFeatured} destaques de cortesía incluidos en tu plan. Puedes destacar esta propiedad pagando el cargo individual correspondiente.`,
      };
    }

    const duration = durationDays || 7;
    let baseDate = new Date();

    // If the property is currently featured and the highlight is not expired yet,
    // we stack/accumulate the duration from the existing expiration date!
    if (
      property.featured &&
      property.featuredExpiresAt &&
      property.featuredExpiresAt > new Date()
    ) {
      baseDate = new Date(property.featuredExpiresAt);
    }

    const featuredExpiresAt = new Date(baseDate.getTime());
    featuredExpiresAt.setDate(featuredExpiresAt.getDate() + duration);

    // Update the property visibility status immediately (Free slot)
    await db.property.update({
      where: { id: propertyId },
      data: {
        featured: true,
        featuredExpiresAt: featuredExpiresAt,
      },
    });

    // Create a transaction to log this free highlight activation for auditability
    await db.transaction.create({
      data: {
        userId: session.userId,
        amount: 0, // Included in plan
        type: 'featured_listing',
        referenceId: propertyId,
        durationDays: duration,
        paymentMethod: 'PLAN_BENEFIT',
        receiptUrl: 'PLAN_BENEFIT_INCLUDED',
        status: 'approved',
        notes: `Destaque de cortesía (${duration} días) activado mediante Plan ${planType}.`,
      },
    });

    revalidatePath(`/dashboard`);
    revalidatePath(`/propiedad/${property.slug}`);

    return {
      success: true,
      message: `¡Destaque de cortesía activado con éxito! Tu anuncio ahora cuenta con el distintivo dorado por ${duration} días.`,
    };
  } catch (error) {
    console.error('Error activating free highlight:', error);
    return { success: false, message: 'Error interno al procesar el destaque gratuito.' };
  }
}

export async function linkAgencyWithCodeAction(agencyCode: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'Debe iniciar sesión para vincularse a una agencia.' };
  }

  const code = agencyCode.trim().toUpperCase();
  if (!code) {
    return { success: false, message: 'El código de agencia no puede estar vacío.' };
  }

  try {
    // 1. Find agency owner by unique code
    const owner = await db.user.findUnique({
      where: { agencyCode: code },
      select: {
        id: true,
        name: true,
        email: true,
        planType: true,
        planExpiresAt: true,
        agencyName: true,
      },
    });

    if (!owner) {
      return { success: false, message: 'El código de agencia ingresado no existe.' };
    }

    // 2. Verify agency plan status
    const isOwnerActive = owner.planType === 'AGENCY' && (owner.planExpiresAt === null || owner.planExpiresAt > new Date());
    if (!isOwnerActive) {
      return { success: false, message: 'El plan de esta agencia está inactivo o ha vencido.' };
    }

    // 3. Prevent self-linking
    if (owner.id === session.userId) {
      return { success: false, message: 'No puedes vincularte a tu propia agencia.' };
    }

    // 4. Enforce strict 5-account limit (1 Owner + up to 4 Agents)
    const linkedCount = await db.user.count({
      where: { linkedAgencyId: owner.id },
    });

    if (linkedCount >= 4) {
      return {
        success: false,
        message: 'Esta inmobiliaria ha alcanzado el límite máximo de agentes vinculados (máximo 4 agentes).',
      };
    }

    // 5. Update user linked agency ID
    await db.user.update({
      where: { id: session.userId },
      data: {
        linkedAgencyId: owner.id,
        // Reset custom direct plan if any, so they inherit agency benefits
        planType: 'FREE',
        planExpiresAt: null,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/planes');

    return {
      success: true,
      message: `¡Te has vinculado con éxito a ${owner.agencyName || 'la Inmobiliaria de ' + owner.name}!`,
    };
  } catch (error) {
    console.error('Error linking agency:', error);
    return { success: false, message: 'Error interno al vincular la cuenta.' };
  }
}

export async function unlinkAgencyAgentAction(agentId?: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autorizado. Debe iniciar sesión.' };
  }

  try {
    if (agentId) {
      // Propietario unlinking an agent
      const currentUser = await db.user.findUnique({
        where: { id: session.userId },
        select: { planType: true, planExpiresAt: true },
      });

      const isAgencyOwner = currentUser?.planType === 'AGENCY';
      if (!isAgencyOwner) {
        return { success: false, message: 'No tienes permisos de administrador de agencia para desvincular agentes.' };
      }

      const agent = await db.user.findUnique({
        where: { id: agentId },
        select: { linkedAgencyId: true },
      });

      if (!agent || agent.linkedAgencyId !== session.userId) {
        return { success: false, message: 'El agente especificado no pertenece a tu inmobiliaria.' };
      }

      await db.user.update({
        where: { id: agentId },
        data: { linkedAgencyId: null },
      });

      revalidatePath('/dashboard');
      return { success: true, message: 'Agente desvinculado con éxito.' };
    } else {
      // Agent unlinking themselves
      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { linkedAgencyId: true },
      });

      if (!user?.linkedAgencyId) {
        return { success: false, message: 'No estás vinculado a ninguna agencia actualmente.' };
      }

      await db.user.update({
        where: { id: session.userId },
        data: { linkedAgencyId: null },
      });

      revalidatePath('/dashboard');
      return { success: true, message: 'Te has desvinculado de la agencia con éxito.' };
    }
  } catch (error) {
    console.error('Error unlinking agent:', error);
    return { success: false, message: 'Error interno al desvincular.' };
  }
}

export async function getAgencyTeamAction() {
  const session = await getSession();
  if (!session) {
    return { success: false, message: 'No autorizado.', role: null };
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { planType: true, planExpiresAt: true, agencyCode: true, agencyName: true, agencyLogo: true, linkedAgencyId: true },
    });

    if (!user) {
      return { success: false, message: 'Usuario no encontrado.', role: null };
    }

    const isDirectActiveAgency = user.planType === 'AGENCY' && (user.planExpiresAt === null || user.planExpiresAt > new Date());

    if (isDirectActiveAgency) {
      // User is the agency owner
      const agents = await db.user.findMany({
        where: { linkedAgencyId: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return {
        success: true,
        role: 'owner',
        agencyCode: user.agencyCode,
        agencyName: user.agencyName,
        agencyLogo: user.agencyLogo,
        agents,
      };
    } else if (user.linkedAgencyId) {
      // User is a linked agent
      const owner = await db.user.findUnique({
        where: { id: user.linkedAgencyId },
        select: {
          name: true,
          email: true,
          agencyName: true,
          agencyLogo: true,
          planType: true,
          planExpiresAt: true,
        },
      });

      const isOwnerActive = !!(
        owner &&
        owner.planType === 'AGENCY' &&
        (owner.planExpiresAt === null || owner.planExpiresAt > new Date())
      );

      return {
        success: true,
        role: 'agent',
        ownerName: owner?.name || 'Propietario',
        ownerEmail: owner?.email || '',
        agencyName: owner?.agencyName || 'Agencia TicoHabitat',
        agencyLogo: owner?.agencyLogo || null,
        isOwnerActive,
      };
    }

    return { success: false, message: 'No forma parte de ninguna inmobiliaria.', role: null };
  } catch (error) {
    console.error('Error fetching agency team:', error);
    return { success: false, message: 'Error interno al consultar el equipo de la agencia.', role: null };
  }
}


