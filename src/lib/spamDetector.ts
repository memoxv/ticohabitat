import { db } from './db';

interface CheckResult {
  isSpam: boolean;
  score: number; // 0 to 100
  reasons: string[];
  matchedPropertyId?: string;
}

/**
 * Normalizes text to make comparison resilient to spacing, emojis, capitalisation and punctuation.
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]/g, '') // Keep alphanumeric only
    .trim();
}

/**
 * Basic Jaccard similarity score between two normalized strings (0 to 100)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);

  if (norm1 === norm2) return 100;
  if (!norm1 || !norm2) return 0;

  // Split into bigrams for Jaccard-like comparison
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const set1 = getBigrams(norm1);
  const set2 = getBigrams(norm2);

  if (set1.size === 0 || set2.size === 0) return 0;

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Analyzes a new property listing against existing ones to detect spam and duplicates.
 */
export async function checkForDuplicates(params: {
  type: string;
  propertyType: string;
  title: string;
  description: string;
  price: number;
  province: string;
  contactPhone: string;
  whatsapp: string;
  imageUrls: string[];
  userId?: string;
}): Promise<CheckResult> {
  const {
    type,
    propertyType,
    title,
    description,
    price,
    province,
    contactPhone,
    imageUrls,
    userId,
  } = params;

  const reasons: string[] = [];
  let highestScore = 0;
  let matchedPropertyId: string | undefined = undefined;

  // 1. Check for identical phone limits or quick duplicate spam (same title and phone)
  const phoneListings = await db.property.findMany({
    where: {
      contactPhone,
      status: { in: ['active', 'pending'] },
    },
    include: {
      images: true,
    },
  });

  // Calculate limits (e.g., maximum 3 listings per phone)
  if (phoneListings.length >= 3) {
    let isPremiumOrAdmin = false;
    if (userId) {
      const { getUserEffectivePlan } = await import('./planInheritance');
      const plan = await getUserEffectivePlan(userId);
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      if (plan.planType === 'PREMIUM' || plan.planType === 'AGENCY' || user?.role === 'ADMIN') {
        isPremiumOrAdmin = true;
      }
    }

    if (!isPremiumOrAdmin) {
      return {
        isSpam: true,
        score: 100,
        reasons: [`Límite excedido: El número de teléfono ${contactPhone} ya tiene 3 o más anuncios activos.`],
      };
    }
  }

  // 2. Query other properties in the same province & type to find content duplicates
  const candidates = await db.property.findMany({
    where: {
      province,
      type,
      propertyType,
      status: { in: ['active', 'pending'] },
    },
    include: {
      images: true,
    },
  });

  for (const item of candidates) {
    let currentScore = 0;
    const itemReasons: string[] = [];

    // Title similarity
    const titleSim = calculateSimilarity(title, item.title);
    if (titleSim > 80) {
      currentScore += 35;
      itemReasons.push(`Título muy similar (${titleSim}% de coincidencia)`);
    }

    // Description similarity
    const descSim = calculateSimilarity(description, item.description);
    if (descSim > 75) {
      currentScore += 45;
      itemReasons.push(`Descripción altamente similar (${descSim}% de coincidencia)`);
    }

    // Price similarity within 5%
    const priceDiff = Math.abs(price - item.price) / Math.max(price, item.price);
    if (priceDiff < 0.05) {
      currentScore += 15;
      itemReasons.push(`Precio casi idéntico (diferencia del ${Math.round(priceDiff * 100)}%)`);
    }

    // Identical image URLs or matching hashes (if provided)
    if (imageUrls && imageUrls.length > 0 && item.images && item.images.length > 0) {
      const match = imageUrls.some(url => item.images.some(img => img.url === url));
      if (match) {
        currentScore += 40;
        itemReasons.push('Coincidencia en enlaces de fotos subidas');
      }
    }

    // Match weighting
    if (currentScore > highestScore) {
      highestScore = currentScore;
      matchedPropertyId = item.id;
      reasons.length = 0;
      reasons.push(...itemReasons);
    }
  }

  // If score is > 75, we consider it a highly suspicious duplicate
  const isSpam = highestScore >= 75;

  return {
    isSpam,
    score: Math.min(highestScore, 100),
    reasons: isSpam ? reasons : [],
    matchedPropertyId,
  };
}
