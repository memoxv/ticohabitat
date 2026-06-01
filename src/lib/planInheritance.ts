import { db } from './db';

export interface EffectivePlan {
  planType: 'FREE' | 'PREMIUM' | 'AGENCY';
  planExpiresAt: Date | null;
  isLinked: boolean;
  linkedAgencyId: string | null;
  agencyName: string | null;
  agencyLogo: string | null;
  isOwnerActive: boolean;
}

export async function getUserEffectivePlan(userId: string): Promise<EffectivePlan> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        planType: true,
        planExpiresAt: true,
        linkedAgencyId: true,
        agencyName: true,
        agencyLogo: true,
      }
    });

    if (!user) {
      return {
        planType: 'FREE',
        planExpiresAt: null,
        isLinked: false,
        linkedAgencyId: null,
        agencyName: null,
        agencyLogo: null,
        isOwnerActive: false
      };
    }

    // If they have a linked agency ID, they are an agent
    if (user.linkedAgencyId) {
      const owner = await db.user.findUnique({
        where: { id: user.linkedAgencyId },
        select: {
          planType: true,
          planExpiresAt: true,
          agencyName: true,
          agencyLogo: true,
        }
      });

      // The owner must have an active AGENCY plan
      const isOwnerActive = !!(
        owner &&
        owner.planType === 'AGENCY' &&
        (owner.planExpiresAt === null || owner.planExpiresAt > new Date())
      );

      if (isOwnerActive) {
        return {
          planType: 'AGENCY',
          planExpiresAt: owner!.planExpiresAt,
          isLinked: true,
          linkedAgencyId: user.linkedAgencyId,
          agencyName: owner!.agencyName || user.agencyName, // Share owner's agency branding
          agencyLogo: owner!.agencyLogo || user.agencyLogo,
          isOwnerActive: true,
        };
      } else {
        // If the owner's plan expired or is no longer agency, the agent degrades to FREE in real-time
        return {
          planType: 'FREE',
          planExpiresAt: null,
          isLinked: true,
          linkedAgencyId: user.linkedAgencyId,
          agencyName: null,
          agencyLogo: null,
          isOwnerActive: false, // Indicates the parent agency plan has expired or deactivated
        };
      }
    }

    // Direct account verification (not linked)
    const isDirectActive = user.planType !== 'FREE' && (user.planExpiresAt === null || user.planExpiresAt > new Date());

    return {
      planType: isDirectActive ? (user.planType as 'PREMIUM' | 'AGENCY') : 'FREE',
      planExpiresAt: isDirectActive ? user.planExpiresAt : null,
      isLinked: false,
      linkedAgencyId: null,
      agencyName: user.agencyName,
      agencyLogo: user.agencyLogo,
      isOwnerActive: false,
    };
  } catch (error) {
    console.error('Error fetching user effective plan:', error);
    return {
      planType: 'FREE',
      planExpiresAt: null,
      isLinked: false,
      linkedAgencyId: null,
      agencyName: null,
      agencyLogo: null,
      isOwnerActive: false
    };
  }
}
