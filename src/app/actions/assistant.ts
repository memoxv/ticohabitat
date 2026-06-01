'use server';

import { db } from '@/lib/db';
import { parseNaturalLanguageQuery, ParsedFilters } from '@/lib/assistantParser';
import { Prisma } from '@prisma/client';
import { runAutoExpirationSweep } from '@/lib/properties';

export interface AssistantSearchResult {
  success: boolean;
  rawQuery: string;
  filters: ParsedFilters;
  matchedCount: number;
  properties: any[];
  isFallback: boolean;
  fallbackReason?: 'no_exact_results' | 'no_filters_detected';
  fallbackProperties: any[];
}

const EXCHANGE_RATE = 500; // 1 USD = 500 CRC (Standard approximation)

/**
 * Server Action to parse a natural language query and search the SQLite database.
 * If no properties match exactly, it triggers our automatic Costa Rican fallback recommender.
 */
export async function searchWithAssistantAction(query: string, overrideFilters?: ParsedFilters): Promise<AssistantSearchResult> {
  try {
    // Run lazy self-healing check before any assistant search
    await runAutoExpirationSweep();

    if ((!query || query.trim() === '') && !overrideFilters) {
      return {
        success: false,
        rawQuery: '',
        filters: {},
        matchedCount: 0,
        properties: [],
        isFallback: false,
        fallbackProperties: [],
      };
    }

    const filters = overrideFilters || parseNaturalLanguageQuery(query);

    // 1. Build strict Prisma where condition
    const where: Prisma.PropertyWhereInput = {
      status: 'active',
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.province) {
      where.province = filters.province;
    }

    if (filters.canton) {
      where.canton = { contains: filters.canton };
    }

    if (filters.district) {
      where.district = { contains: filters.district };
    }

    if (filters.propertyType) {
      where.propertyType = filters.propertyType;
    }

    if (filters.bedrooms) {
      where.bedrooms = { gte: filters.bedrooms };
    }

    if (filters.bathrooms) {
      where.bathrooms = { gte: filters.bathrooms };
    }

    if (filters.petsAllowed) {
      where.petsAllowed = true;
    }

    if (filters.condominium) {
      where.condominium = true;
    }

    if (filters.furnished) {
      where.furnished = true;
    }

    // Smart Price Range Matching inside DB with cross-currency conversion
    if (filters.priceMax) {
      const maxVal = filters.priceMax;
      if (filters.currency === 'CRC') {
        where.OR = [
          {
            currency: 'CRC',
            price: { lte: maxVal },
          },
          {
            currency: 'USD',
            price: { lte: maxVal / EXCHANGE_RATE },
          },
        ];
      } else {
        where.OR = [
          {
            currency: 'USD',
            price: { lte: maxVal },
          },
          {
            currency: 'CRC',
            price: { lte: maxVal * EXCHANGE_RATE },
          },
        ];
      }
    } else if (filters.priceMin) {
      const minVal = filters.priceMin;
      if (filters.currency === 'CRC') {
        where.OR = [
          {
            currency: 'CRC',
            price: { gte: minVal },
          },
          {
            currency: 'USD',
            price: { gte: minVal / EXCHANGE_RATE },
          },
        ];
      } else {
        where.OR = [
          {
            currency: 'USD',
            price: { gte: minVal },
          },
          {
            currency: 'CRC',
            price: { gte: minVal * EXCHANGE_RATE },
          },
        ];
      }
    }

    // Query exact database matches
    const exactProperties = await db.property.findMany({
      where,
      include: {
        images: true,
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 6,
    });

    if (exactProperties.length > 0) {
      return {
        success: true,
        rawQuery: query,
        filters,
        matchedCount: exactProperties.length,
        properties: exactProperties,
        isFallback: false,
        fallbackProperties: [],
      };
    }

    // 2. Exact matches yielded 0. Let's run the fallback algorithm!
    const fallbackWhere: Prisma.PropertyWhereInput = {
      status: 'active',
    };

    // Keep modality (buy vs rent) if specified
    if (filters.type) {
      fallbackWhere.type = filters.type;
    }

    // Keep propertyType if specified
    if (filters.propertyType) {
      fallbackWhere.propertyType = filters.propertyType;
    }

    // Relax canton/district constraints: keep province, or default to general matching
    if (filters.province) {
      fallbackWhere.province = filters.province;
    }

    // Expand price parameters by 30% to offer similar range options
    if (filters.priceMax) {
      const expandedMax = filters.priceMax * 1.3;
      if (filters.currency === 'CRC') {
        fallbackWhere.OR = [
          { currency: 'CRC', price: { lte: expandedMax } },
          { currency: 'USD', price: { lte: expandedMax / EXCHANGE_RATE } },
        ];
      } else {
        fallbackWhere.OR = [
          { currency: 'USD', price: { lte: expandedMax } },
          { currency: 'CRC', price: { lte: expandedMax * EXCHANGE_RATE } },
        ];
      }
    }

    // Fetch fallback properties
    const fallbackProperties = await db.property.findMany({
      where: fallbackWhere,
      include: {
        images: true,
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 4,
    });

    return {
      success: true,
      rawQuery: query,
      filters,
      matchedCount: 0,
      properties: [],
      isFallback: true,
      fallbackReason: 'no_exact_results',
      fallbackProperties,
    };
  } catch (error) {
    console.error('Error in searchWithAssistantAction:', error);
    return {
      success: false,
      rawQuery: query,
      filters: {},
      matchedCount: 0,
      properties: [],
      isFallback: false,
      fallbackProperties: [],
    };
  }
}
