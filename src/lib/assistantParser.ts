/**
 * Intelligent Natural Language Parser for TicoHabitat (Costa Rica context)
 * Handles spelling errors, omitted spaces, Costa Rican monetary slang,
 * abbreviations, and real estate synonyms.
 * Near-zero cost rule-based entity extraction.
 */

export interface ParsedFilters {
  type?: 'buy' | 'rent';
  province?: string;
  canton?: string;
  district?: string;
  propertyType?: string;
  priceMax?: number;
  priceMin?: number;
  currency?: 'CRC' | 'USD';
  bedrooms?: number;
  bathrooms?: number;
  petsAllowed?: boolean;
  condominium?: boolean;
  furnished?: boolean;
}

interface GeographyMapping {
  name: string;
  type: 'canton' | 'district';
  province: string;
  canton?: string;
}

const PROVINCES = [
  'San José',
  'Alajuela',
  'Heredia',
  'Cartago',
  'Guanacaste',
  'Puntarenas',
  'Limón'
];

const GEOGRAPHY_DB: Record<string, GeographyMapping> = {
  // San José
  'escazu': { name: 'Escazú', type: 'canton', province: 'San José' },
  'santa ana': { name: 'Santa Ana', type: 'canton', province: 'San José' },
  'sabana': { name: 'Sabana', type: 'district', province: 'San José', canton: 'San José' },
  'la sabana': { name: 'Sabana', type: 'district', province: 'San José', canton: 'San José' },
  'tibas': { name: 'Tibás', type: 'canton', province: 'San José' },
  'moravia': { name: 'Moravia', type: 'canton', province: 'San José' },
  'curridabat': { name: 'Curridabat', type: 'canton', province: 'San José' },
  'san pedro': { name: 'San Pedro', type: 'district', province: 'San José', canton: 'Montes de Oca' },
  'montes de oca': { name: 'Montes de Oca', type: 'canton', province: 'San José' },
  'sabanilla': { name: 'Sabanilla', type: 'district', province: 'San José', canton: 'Montes de Oca' },
  'perez zeledon': { name: 'Pérez Zeledón', type: 'canton', province: 'San José' },
  'puriscal': { name: 'Puriscal', type: 'canton', province: 'San José' },
  'desamparados': { name: 'Desamparados', type: 'canton', province: 'San José' },
  'goicoechea': { name: 'Goicoechea', type: 'canton', province: 'San José' },
  'guadalupe': { name: 'Guadalupe', type: 'district', province: 'San José', canton: 'Goicoechea' },
  
  // Alajuela
  'poas': { name: 'Poás', type: 'canton', province: 'Alajuela' },
  'grecia': { name: 'Grecia', type: 'canton', province: 'Alajuela' },
  'san ramon': { name: 'San Ramón', type: 'canton', province: 'Alajuela' },
  'atenas': { name: 'Atenas', type: 'canton', province: 'Alajuela' },
  'san carlos': { name: 'San Carlos', type: 'canton', province: 'Alajuela' },
  'la fortuna': { name: 'La Fortuna', type: 'district', province: 'Alajuela', canton: 'San Carlos' },
  'naranjo': { name: 'Naranjo', type: 'canton', province: 'Alajuela' },
  
  // Heredia
  'belen': { name: 'Belén', type: 'canton', province: 'Heredia' },
  'barva': { name: 'Barva', type: 'canton', province: 'Heredia' },
  'san rafael': { name: 'San Rafael', type: 'canton', province: 'Heredia' },
  'santo domingo': { name: 'Santo Domingo', type: 'canton', province: 'Heredia' },
  'san isidro': { name: 'San Isidro', type: 'canton', province: 'Heredia' },
  'flores': { name: 'Flores', type: 'canton', province: 'Heredia' },
  
  // Cartago
  'orosi': { name: 'Orosi', type: 'district', province: 'Cartago', canton: 'Paraíso' },
  'paraiso': { name: 'Paraíso', type: 'canton', province: 'Cartago' },
  'tres rios': { name: 'Tres Ríos', type: 'district', province: 'Cartago', canton: 'La Unión' },
  'la union': { name: 'La Unión', type: 'canton', province: 'Cartago' },
  'el guarco': { name: 'El Guarco', type: 'canton', province: 'Cartago' },
  'turrialba': { name: 'Turrialba', type: 'canton', province: 'Cartago' },
  
  // Guanacaste
  'liberia': { name: 'Liberia', type: 'canton', province: 'Guanacaste' },
  'tamarindo': { name: 'Tamarindo', type: 'district', province: 'Guanacaste', canton: 'Santa Cruz' },
  'nosara': { name: 'Nosara', type: 'district', province: 'Guanacaste', canton: 'Nicoya' },
  'samara': { name: 'Sámara', type: 'district', province: 'Guanacaste', canton: 'Nicoya' },
  'flamingo': { name: 'Flamingo', type: 'district', province: 'Guanacaste', canton: 'Santa Cruz' },
  'conchal': { name: 'Conchal', type: 'district', province: 'Guanacaste', canton: 'Santa Cruz' },
  'coco': { name: 'Playas del Coco', type: 'district', province: 'Guanacaste', canton: 'Carrillo' },
  'carrillo': { name: 'Carrillo', type: 'canton', province: 'Guanacaste' },
  'nicoya': { name: 'Nicoya', type: 'canton', province: 'Guanacaste' },
  'santa cruz': { name: 'Santa Cruz', type: 'canton', province: 'Guanacaste' },
  
  // Puntarenas
  'jaco': { name: 'Jacó', type: 'district', province: 'Puntarenas', canton: 'Garabito' },
  'garabito': { name: 'Garabito', type: 'canton', province: 'Puntarenas' },
  'quepos': { name: 'Quepos', type: 'canton', province: 'Puntarenas' },
  'manuel antonio': { name: 'Manuel Antonio', type: 'district', province: 'Puntarenas', canton: 'Quepos' },
  'dominical': { name: 'Dominical', type: 'district', province: 'Puntarenas', canton: 'Osa' },
  'uvita': { name: 'Uvita', type: 'district', province: 'Puntarenas', canton: 'Osa' },
  'monteverde': { name: 'Monteverde', type: 'canton', province: 'Puntarenas' },
  
  // Limón
  'cahuita': { name: 'Cahuita', type: 'district', province: 'Limón', canton: 'Talamanca' },
  'puerto viejo': { name: 'Puerto Viejo', type: 'district', province: 'Limón', canton: 'Talamanca' },
  'cocles': { name: 'Cocles', type: 'district', province: 'Limón', canton: 'Talamanca' },
  'talamanca': { name: 'Talamanca', type: 'canton', province: 'Limón' },
  'guapiles': { name: 'Guápiles', type: 'district', province: 'Limón', canton: 'Pococí' },
  'pococi': { name: 'Pococí', type: 'canton', province: 'Limón' },
};

/**
 * Levenshtein distance algorithm for robust fuzzy string matching
 */
function levenshtein(a: string, b: string): number {
  const tmp: number[][] = [];
  let i: number, j: number;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Checks if two strings are spelling-similar within a custom threshold
 */
function areSimilar(w1: string, w2: string): boolean {
  const threshold = w2.length > 6 ? 2 : 1;
  if (Math.abs(w1.length - w2.length) > threshold) return false;
  return levenshtein(w1, w2) <= threshold;
}

/**
 * Normalizes text: strips accents, lowercases, and repairs space-omissions
 */
function normalizeText(text: string): string {
  let cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Repair space-omissions for popular locations & terms
  const replacements: Record<string, string> = {
    'sanjose': 'san jose',
    'santaana': 'santa ana',
    'tresrios': 'tres rios',
    'sampedro': 'san pedro',
    'lafortuna': 'la fortuna',
    'manuelantonio': 'manuel antonio',
    'puertoviejo': 'puerto viejo',
    'santodomingo': 'santo domingo',
    'sanrafael': 'san rafael',
    'sanisidro': 'san isidro',
    'perezzeledon': 'perez zeledon',
    'montesdeoca': 'montes de oca',
    'playasdelcoco': 'coco',
    'playadelcoco': 'coco',
    'petfriendly': 'pet friendly',
    'habs': 'habitaciones',
    'hab': 'habitacion',
    'dorm': 'habitacion',
    'dorms': 'habitaciones',
    'cuartos': 'habitaciones',
    'cuarto': 'habitacion',
    'banos': 'baños',
    'bano': 'baño'
  };

  for (const [key, val] of Object.entries(replacements)) {
    cleaned = cleaned.replace(new RegExp(`\\b${key}\\b`, 'g'), val);
  }

  // Fallback direct replacements for exact concatenated terms without boundary failures
  cleaned = cleaned
    .replace(/sanjose/g, 'san jose')
    .replace(/santaana/g, 'santa ana')
    .replace(/tresrios/g, 'tres rios')
    .replace(/sampedro/g, 'san pedro')
    .replace(/lafortuna/g, 'la fortuna')
    .replace(/manuelantonio/g, 'manuel antonio')
    .replace(/puertoviejo/g, 'puerto viejo');

  return cleaned;
}

/**
 * Extracts prices specified in Costa Rican monetary slang
 * Supports "medio palo", "rojos", "tejas", "melones"
 */
function parseSlangPrice(text: string): { price: number; currency: 'CRC' } | null {
  // 1. "medio palo" / "medio melon" -> 500,000 colones
  if (/\b(?:medio palo|medio melon)\b/.test(text)) {
    return { price: 500000, currency: 'CRC' };
  }

  // 2. "un palo" / "un melon" -> 1,000,000 colones
  if (/\b(?:un palo|un melon)\b/.test(text)) {
    return { price: 1000000, currency: 'CRC' };
  }

  // 3. X melones / X palos -> X * 1,000,000
  const melonMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:melones|melon|palos|palo)\b/);
  if (melonMatch) {
    return { price: parseFloat(melonMatch[1]) * 1000000, currency: 'CRC' };
  }
  const textMelonsMap: Record<string, number> = { dos: 2, tres: 3, cuatro: 4, cinco: 5, diez: 10, veinte: 20, treinta: 30, cincuenta: 50 };
  const melonTextMatch = text.match(/\b(dos|tres|cuatro|cinco|diez|veinte|treinta|cincuenta)\s*(?:melones|melon|palos|palo)\b/);
  if (melonTextMatch) {
    const mult = textMelonsMap[melonTextMatch[1]] || 1;
    return { price: mult * 1000000, currency: 'CRC' };
  }

  // 4. X tejas -> X * 100,000 colones (Costa Rican standard)
  const tejaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:tejas|teja)\b/);
  if (tejaMatch) {
    return { price: parseFloat(tejaMatch[1]) * 100000, currency: 'CRC' };
  }
  const textTejasMap: Record<string, number> = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9 };
  const tejaTextMatch = text.match(/\b(un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s*(?:tejas|teja)\b/);
  if (tejaTextMatch) {
    const val = textTejasMap[tejaTextMatch[1]] || 1;
    return { price: val * 100000, currency: 'CRC' };
  }

  // 5. X rojos -> X * 1,000 colones
  const rojoMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:rojos|rojo)\b/);
  if (rojoMatch) {
    return { price: parseFloat(rojoMatch[1]) * 1000, currency: 'CRC' };
  }

  return null;
}

export function parseNaturalLanguageQuery(query: string): ParsedFilters {
  const filters: ParsedFilters = {};
  const normalized = normalizeText(query);

  // 1. Transaction Type (buy vs rent)
  const rentKeywords = ['alquiler', 'alquilar', 'alquilo', 'renta', 'rentar', 'arriendo', 'rento', 'alquile'];
  const buyKeywords = ['compra', 'comprar', 'venta', 'vendo', 'vender', 'adquirir', 'compro', 'lote en venta', 'casa en venta'];

  const hasRent = rentKeywords.some(kw => normalized.includes(kw));
  const hasBuy = buyKeywords.some(kw => normalized.includes(kw));

  if (hasRent) {
    filters.type = 'rent';
  } else if (hasBuy) {
    filters.type = 'buy';
  }

  // 2. Property Type (with comprehensive real estate synonyms)
  const houseSynonyms = ['casa', 'casita', 'vivienda', 'hogar', 'residencial', 'choza', 'cabaña', 'cabanita', 'chalet'];
  const aptSynonyms = ['apartamento', 'apto', 'apartamentito', 'estudio', 'torre', 'condo', 'condominio', 'depa', 'departamento', 'penthouse'];
  const lotSynonyms = ['lote', 'terreno', 'solar', 'tierrita', 'propiedad'];
  const quintaSynonyms = ['quinta', 'quintas', 'recreo', 'finca'];
  const commSynonyms = ['local', 'oficina', 'bodega', 'negocio', 'comercial', 'establecimiento'];
  const beachSynonyms = ['playa', 'playera', 'mar', 'costera', 'oceanica'];

  if (houseSynonyms.some(s => new RegExp(`\\b${s}\\b`).test(normalized))) {
    filters.propertyType = 'house';
  } else if (aptSynonyms.some(s => new RegExp(`\\b${s}\\b`).test(normalized))) {
    filters.propertyType = 'apartment';
  } else if (quintaSynonyms.some(s => new RegExp(`\\b${s}\\b`).test(normalized))) {
    filters.propertyType = 'quinta';
  } else if (lotSynonyms.some(s => new RegExp(`\\b${s}\\b`).test(normalized))) {
    filters.propertyType = 'lot';
  } else if (commSynonyms.some(s => new RegExp(`\\b${s}\\b`).test(normalized))) {
    filters.propertyType = 'commercial';
  } else if (beachSynonyms.some(s => new RegExp(`\\b${s}\\b`).test(normalized))) {
    filters.propertyType = 'beach';
  }

  // 3. Location Extraction (Province, Canton, District)
  let locationFound = false;

  // Exact match first (highly optimized)
  for (const prov of PROVINCES) {
    const normProv = normalizeText(prov);
    if (normalized.includes(normProv)) {
      filters.province = prov;
      locationFound = true;
      break;
    }
  }

  if (!locationFound) {
    for (const [key, mapping] of Object.entries(GEOGRAPHY_DB)) {
      if (normalized.includes(key)) {
        filters.province = mapping.province;
        if (mapping.type === 'canton') {
          filters.canton = mapping.name;
        } else {
          filters.canton = mapping.canton;
          filters.district = mapping.name;
        }
        locationFound = true;
        break;
      }
    }
  }

  // Fuzzy match Levenshtein spelling correction
  const tokens = normalized.split(/\s+/);
  
  if (!locationFound) {
    // Provinces fuzzy match
    for (const prov of PROVINCES) {
      const normProv = normalizeText(prov);
      for (const t of tokens) {
        if (t.length >= 4 && areSimilar(t, normProv)) {
          filters.province = prov;
          locationFound = true;
          break;
        }
      }
      if (locationFound) break;
    }
  }

  if (!locationFound) {
    // Cantons & Districts fuzzy match
    for (const [key, mapping] of Object.entries(GEOGRAPHY_DB)) {
      if (key.length < 4) continue; // prevent false matching on extremely short words
      
      for (const t of tokens) {
        if (t.length >= 4 && areSimilar(t, key)) {
          filters.province = mapping.province;
          if (mapping.type === 'canton') {
            filters.canton = mapping.name;
          } else {
            filters.canton = mapping.canton;
            filters.district = mapping.name;
          }
          locationFound = true;
          break;
        }
      }
      if (locationFound) break;
    }
  }

  // 4. Bedrooms
  const bedroomsMatch = normalized.match(/(\d+|un|una|dos|tres|cuatro|cinco)\s*(?:habs?|cuartos?|dormitorios?|habitaciones?)/);
  if (bedroomsMatch) {
    const val = bedroomsMatch[1];
    if (/\d+/.test(val)) {
      filters.bedrooms = parseInt(val);
    } else {
      const textMap: Record<string, number> = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5 };
      filters.bedrooms = textMap[val];
    }
  }

  // 5. Bathrooms
  const bathroomsMatch = normalized.match(/(\d+|un|una|dos|tres|cuatro)\s*(?:banos?|sanitarios?)/);
  if (bathroomsMatch) {
    const val = bathroomsMatch[1];
    if (/\d+/.test(val)) {
      filters.bathrooms = parseInt(val);
    } else {
      const textMap: Record<string, number> = { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4 };
      filters.bathrooms = textMap[val];
    }
  }

  // 6. Pets Allowed
  if (/\b(?:mascota|mascotas|perro|perros|gato|gatos|animales|pet friendly|pets)\b/.test(normalized)) {
    filters.petsAllowed = true;
  }

  // 7. Condominium
  if (/\b(?:condominio|condo|torre|seguridad 24\/7|acceso controlado)\b/.test(normalized)) {
    filters.condominium = true;
  }

  // 8. Furnished
  if (/\b(?:amueblado|amueblada|amoblado|amoblada|equipado|equipada)\b/.test(normalized)) {
    filters.furnished = true;
  }

  // 9. Budget / Price Range (Checks slang first, falls back to regular numeric formats)
  let parsedPrice: number | null = null;
  const slangResult = parseSlangPrice(normalized);

  if (slangResult !== null) {
    parsedPrice = slangResult.price;
    filters.currency = slangResult.currency;
  } else {
    // Regular numeric checks (e.g., "30 millones", "200 mil")
    const millMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:millones|millon|mills|mill|m)\b/);
    if (millMatch) {
      parsedPrice = parseFloat(millMatch[1].replace(',', '.')) * 1000000;
    } else {
      const milMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:mil|k)\b/);
      if (milMatch) {
        parsedPrice = parseFloat(milMatch[1].replace(',', '.')) * 1000;
      } else {
        const isolatedMatch = normalized.match(/\b(\d{3,10})\b/);
        if (isolatedMatch) {
          parsedPrice = parseInt(isolatedMatch[1]);
        }
      }
    }
  }

  if (parsedPrice !== null) {
    if (!filters.currency) {
      // Detect Currency
      const usdKeywords = ['$', 'dolares', 'dolar', 'usd'];
      const crcKeywords = ['₡', 'colones', 'colon', 'crc'];
      const hasUsd = usdKeywords.some(kw => normalized.includes(kw));
      const hasCrc = crcKeywords.some(kw => normalized.includes(kw));

      if (hasUsd) {
        filters.currency = 'USD';
      } else if (hasCrc) {
        filters.currency = 'CRC';
      } else {
        // Auto-Detection
        if (filters.type === 'rent') {
          filters.currency = parsedPrice < 5000 ? 'USD' : 'CRC';
        } else {
          filters.currency = parsedPrice < 1000000 ? 'USD' : 'CRC';
        }
      }
    }

    // Direction (min vs max)
    const minKeywords = ['mayor a', 'mas de', 'desde', 'minimo', 'min'];
    const hasMin = minKeywords.some(kw => normalized.includes(kw));

    if (hasMin) {
      filters.priceMin = parsedPrice;
    } else {
      filters.priceMax = parsedPrice;
    }
  }

  return filters;
}
