'use server';

import { db } from '@/lib/db';
import { getSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { revalidatePropertyPaths } from '@/app/actions/properties';

export async function getPendingTransactionsAction() {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, message: 'No autorizado. Debe ser administrador.', transactions: [] };
  }

  try {
    const transactions = await db.transaction.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            planType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Also get the property details for featured transactions
    const enrichedTransactions = await Promise.all(
      transactions.map(async (tx) => {
        if (tx.type === 'featured_listing' && tx.referenceId) {
          const property = await db.property.findUnique({
            where: { id: tx.referenceId },
            select: {
              title: true,
              slug: true,
              price: true,
              currency: true,
              province: true,
            },
          });
          return { ...tx, property };
        }
        return { ...tx, property: null };
      })
    );

    return { success: true, transactions: enrichedTransactions };
  } catch (error) {
    console.error('Error fetching pending transactions:', error);
    return { success: false, message: 'Error al consultar transacciones pendientes.', transactions: [] };
  }
}

export async function moderateTransactionAction(
  transactionId: string,
  status: 'approved' | 'rejected',
  notes?: string
) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') {
    return { success: false, message: 'No autorizado. Debe ser administrador.' };
  }

  try {
    const tx = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!tx) {
      return { success: false, message: 'Transacción no encontrada.' };
    }

    if (tx.status !== 'pending') {
      return { success: false, message: 'Esta transacción ya ha sido procesada.' };
    }

    if (status === 'approved') {
      // 1. Process by type
      if (tx.type === 'featured_listing') {
        if (!tx.referenceId) {
          return { success: false, message: 'Referencia de propiedad inválida para destacar.' };
        }

        // Fetch current property highlight status
        const property = await db.property.findUnique({
          where: { id: tx.referenceId },
          select: { featured: true, featuredExpiresAt: true },
        });

        const duration = tx.durationDays || 7;
        let baseDate = new Date();

        // If the property is currently featured and the highlight is not expired yet,
        // we stack/accumulate the duration from the existing expiration date!
        if (
          property &&
          property.featured &&
          property.featuredExpiresAt &&
          property.featuredExpiresAt > new Date()
        ) {
          baseDate = new Date(property.featuredExpiresAt);
        }

        const featuredExpiresAt = new Date(baseDate.getTime());
        featuredExpiresAt.setDate(featuredExpiresAt.getDate() + duration);

        // Update the property visibility status
        await db.property.update({
          where: { id: tx.referenceId },
          data: {
            featured: true,
            featuredExpiresAt: featuredExpiresAt,
          },
        });
      } else if (tx.type === 'premium_plan' || tx.type === 'agency_plan') {
        const planDuration = 30; // 30-day standard billing cycle
        const planType = tx.type === 'premium_plan' ? 'PREMIUM' : 'AGENCY';

        // Fetch current user plan status
        const user = await db.user.findUnique({
          where: { id: tx.userId },
          select: { planType: true, planExpiresAt: true, agencyCode: true },
        });

        let baseDate = new Date();

        // If the user already has the EXACT SAME plan active and not expired,
        // we stack/accumulate the 30 days from their existing expiration date!
        if (
          user &&
          user.planType === planType &&
          user.planExpiresAt &&
          user.planExpiresAt > new Date()
        ) {
          baseDate = new Date(user.planExpiresAt);
        }

        const planExpiresAt = new Date(baseDate.getTime());
        planExpiresAt.setDate(planExpiresAt.getDate() + planDuration);

        let agencyName: string | undefined;
        let agencyLogo: string | undefined;

        // Parse agency branding if sent in transaction notes
        if (tx.type === 'agency_plan' && tx.notes) {
          try {
            const parsed = JSON.parse(tx.notes);
            agencyName = parsed.agencyName;
            agencyLogo = parsed.agencyLogo;
          } catch {
            // Keep default if JSON parsing fails
          }
        }

        let generatedAgencyCode = undefined;
        if (planType === 'AGENCY' && !user?.agencyCode) {
          // Generate a unique 6-character random uppercase alphanumeric agency code: AG-XXXXXX
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let uniqueCode = '';
          let isUnique = false;
          while (!isUnique) {
            uniqueCode = 'AG-';
            for (let i = 0; i < 6; i++) {
              uniqueCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            // Check if this code already exists in DB
            const existingUser = await db.user.findUnique({
              where: { agencyCode: uniqueCode },
            });
            if (!existingUser) {
              isUnique = true;
            }
          }
          generatedAgencyCode = uniqueCode;
        }

        await db.user.update({
          where: { id: tx.userId },
          data: {
            planType,
            planExpiresAt,
            ...(agencyName ? { agencyName } : {}),
            ...(agencyLogo ? { agencyLogo } : {}),
            ...(generatedAgencyCode ? { agencyCode: generatedAgencyCode } : {}),
          },
        });
      }

      // 2. Mark transaction as approved
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'approved',
          notes: notes || 'Aprobado por el Administrador.',
        },
      });
    } else {
      // Rejected
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'rejected',
          notes: notes || 'Transacción rechazada por el Administrador.',
        },
      });
    }

    // Revalidate paths for instant UI changes
    revalidatePath('/admin/monetizacion');
    revalidatePath('/dashboard/planes');
    if (tx.referenceId) {
      const property = await db.property.findUnique({
        where: { id: tx.referenceId },
        select: { slug: true, province: true },
      });
      if (property) {
        revalidatePropertyPaths({
          provinces: [property.province],
          propertySlug: property.slug,
        });
      } else {
        revalidatePropertyPaths({});
      }
    } else {
      revalidatePropertyPaths({});
    }

    return {
      success: true,
      message: `Transacción ${status === 'approved' ? 'aprobada' : 'rechazada'} con éxito.`,
    };
  } catch (error) {
    console.error('Error moderating transaction:', error);
    return { success: false, message: 'Error interno al moderar transacción.' };
  }
}
