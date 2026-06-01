export interface FeatureDefinition {
  key: string;
  label: string;
  category: 'comodidad' | 'ubicacion' | 'seguridad' | 'amenidades' | 'estructura' | 'extras';
  isPrimary?: boolean; // Primary features shown immediately, secondary under "Más opciones"
}

export const FEATURE_CATEGORIES: Record<string, string> = {
  comodidad: 'Comodidad & Confort',
  ubicacion: 'Entorno & Ubicación',
  seguridad: 'Seguridad & Accesos',
  amenidades: 'Amenidades & Recreación',
  estructura: 'Características Estructurales',
  extras: 'Extras / Uso del Inmueble',
};

export const MASTER_FEATURES: Record<string, FeatureDefinition[]> = {
  house: [
    // Primary
    { key: 'permite_mascotas', label: 'Permite Mascotas', category: 'comodidad', isPrimary: true },
    { key: 'en_condominio', label: 'En Condominio', category: 'estructura', isPrimary: true },
    { key: 'patio', label: 'Patio Trasero', category: 'estructura', isPrimary: true },
    { key: 'jardin', label: 'Jardín Frontal', category: 'estructura', isPrimary: true },
    { key: 'parqueo_techado', label: 'Parqueo Techado', category: 'estructura', isPrimary: true },
    { key: 'seguridad', label: 'Seguridad 24/7', category: 'seguridad', isPrimary: true },
    { key: 'una_planta', label: 'Casa de una Planta', category: 'estructura', isPrimary: true },
    { key: 'cuarto_de_pilas', label: 'Cuarto de Pilas', category: 'estructura', isPrimary: true },
    
    // Secondary
    { key: 'terraza', label: 'Terraza', category: 'estructura', isPrimary: false },
    { key: 'balcon', label: 'Balcón', category: 'estructura', isPrimary: false },
    { key: 'piscina', label: 'Piscina Privada', category: 'amenidades', isPrimary: false },
    { key: 'amueblado', label: 'Amueblada', category: 'comodidad', isPrimary: false },
    { key: 'porton_electrico', label: 'Portón Eléctrico', category: 'seguridad', isPrimary: false },
    { key: 'bodega', label: 'Bodega', category: 'estructura', isPrimary: false },
    { key: 'dos_plantas', label: 'Casa de dos Plantas', category: 'estructura', isPrimary: false },
    { key: 'aire_acondicionado', label: 'Aire Acondicionado', category: 'comodidad', isPrimary: false },
    { key: 'area_bbq', label: 'Área de BBQ', category: 'amenidades', isPrimary: false },
    { key: 'oficina', label: 'Oficina / Estudio', category: 'comodidad', isPrimary: false },
    { key: 'accesibilidad_universal', label: 'Accesibilidad Universal', category: 'comodidad', isPrimary: false },
  ],
  apartment: [
    // Primary
    { key: 'permite_mascotas', label: 'Pet Friendly / Mascotas', category: 'comodidad', isPrimary: true },
    { key: 'en_condominio', label: 'En Torre / Condominio', category: 'estructura', isPrimary: true },
    { key: 'balcon', label: 'Balcón Privado', category: 'estructura', isPrimary: true },
    { key: 'parqueo_techado', label: 'Parqueo Techado', category: 'estructura', isPrimary: true },
    { key: 'seguridad', label: 'Seguridad / Vigilancia', category: 'seguridad', isPrimary: true },
    { key: 'ascensor', label: 'Ascensor', category: 'estructura', isPrimary: true },
    { key: 'acceso_controlado', label: 'Acceso Controlado', category: 'seguridad', isPrimary: true },
    
    // Secondary
    { key: 'amueblado', label: 'Totalmente Amueblado', category: 'comodidad', isPrimary: false },
    { key: 'cuarto_de_pilas', label: 'Cuarto de Pilas Interno', category: 'estructura', isPrimary: false },
    { key: 'piscina_compartida', label: 'Piscina Compartida', category: 'amenidades', isPrimary: false },
    { key: 'area_social', label: 'Área Social / Casa Club', category: 'amenidades', isPrimary: false },
    { key: 'gimnasio', label: 'Gimnasio Equipado', category: 'amenidades', isPrimary: false },
    { key: 'bodega', label: 'Bodega Privada', category: 'estructura', isPrimary: false },
    { key: 'vista_panoramica', label: 'Vista Panorámica', category: 'ubicacion', isPrimary: false },
    { key: 'play_niños', label: 'Play de Niños', category: 'amenidades', isPrimary: false },
    { key: 'recepcion', label: 'Lobby / Recepción', category: 'seguridad', isPrimary: false },
  ],
  lot: [
    // Primary
    { key: 'frente_calle', label: 'Frente a Calle Pública', category: 'ubicacion', isPrimary: true },
    { key: 'lote_plano', label: 'Topografía Plana', category: 'estructura', isPrimary: true },
    { key: 'apto_construir', label: 'Listo para Construir', category: 'extras', isPrimary: true },
    { key: 'acceso_agua', label: 'Disponibilidad de Agua', category: 'comodidad', isPrimary: true },
    { key: 'acceso_electricidad', label: 'Disponibilidad de Luz', category: 'comodidad', isPrimary: true },
    { key: 'suelo_residencial', label: 'Uso de Suelo Residencial', category: 'extras', isPrimary: true },
    
    // Secondary
    { key: 'suelo_mixto', label: 'Uso de Suelo Mixto', category: 'extras', isPrimary: false },
    { key: 'lote_pendiente', label: 'Lote con Pendiente', category: 'estructura', isPrimary: false },
    { key: 'acceso_internet', label: 'Internet de Alta Velocidad', category: 'comodidad', isPrimary: false },
    { key: 'con_tapia', label: 'Con Tapia Perimetral', category: 'seguridad', isPrimary: false },
    { key: 'con_arboles', label: 'Lote con Árboles', category: 'ubicacion', isPrimary: false },
    { key: 'esquina', label: 'Lote en Esquina', category: 'ubicacion', isPrimary: false },
    { key: 'calle_lastreada', label: 'Frente a Calle Lastreada', category: 'ubicacion', isPrimary: false },
  ],
  quinta: [
    // Primary
    { key: 'area_verde', label: 'Amplia Área Verde', category: 'ubicacion', isPrimary: true },
    { key: 'acceso_agua', label: 'Acceso a Agua Pública', category: 'comodidad', isPrimary: true },
    { key: 'acceso_electricidad', label: 'Servicio de Electricidad', category: 'comodidad', isPrimary: true },
    { key: 'casa_principal', label: 'Cuenta con Casa Principal', category: 'estructura', isPrimary: true },
    { key: 'uso_recreativo', label: 'Apto para Recreo / Quinta', category: 'extras', isPrimary: true },
    { key: 'acceso_vehicular', label: 'Buen Acceso Vehicular', category: 'ubicacion', isPrimary: true },
    
    // Secondary
    { key: 'casas_adicionales', label: 'Casas Adicionales / Huéspedes', category: 'estructura', isPrimary: false },
    { key: 'rio_quebrada', label: 'Río o Quebrada Limítrofe', category: 'ubicacion', isPrimary: false },
    { key: 'pozo', label: 'Pozo de Agua Propio', category: 'comodidad', isPrimary: false },
    { key: 'uso_agricola', label: 'Uso de Suelo Agrícola', category: 'extras', isPrimary: false },
    { key: 'apto_caballos', label: 'Apto para Caballos / Animales', category: 'extras', isPrimary: false },
    { key: 'cerca_perimetral', label: 'Cerca Perimetral / Tapia', category: 'seguridad', isPrimary: false },
    { key: 'senderos', label: 'Senderos Internos', category: 'amenidades', isPrimary: false },
    { key: 'bosque', label: 'Zona Boscosa Privada', category: 'ubicacion', isPrimary: false },
    { key: 'topografia_variada', label: 'Topografía Variada / Lomitas', category: 'estructura', isPrimary: false },
    { key: 'vista_panoramica', label: 'Vista Panorámica Hermosa', category: 'ubicacion', isPrimary: false },
    { key: 'finca_productiva', label: 'Finca Productiva / Sembrada', category: 'extras', isPrimary: false },
  ],
  commercial: [
    // Primary
    { key: 'frente_calle', label: 'Frente a Calle Principal', category: 'ubicacion', isPrimary: true },
    { key: 'alto_transito', label: 'Zona de Alto Tránsito', category: 'ubicacion', isPrimary: true },
    { key: 'parqueo_clientes', label: 'Parqueo para Clientes', category: 'comodidad', isPrimary: true },
    { key: 'baño_privado', label: 'Baños Privados', category: 'estructura', isPrimary: true },
    { key: 'uso_comercial', label: 'Uso de Suelo Comercial', category: 'extras', isPrimary: true },
    { key: 'seguridad', label: 'Seguridad / Vigilancia', category: 'seguridad', isPrimary: true },
    
    // Secondary
    { key: 'acceso_camion', label: 'Acceso para Camión / Furgón', category: 'seguridad', isPrimary: false },
    { key: 'cortinas_metalicas', label: 'Cortinas Metálicas Cierre', category: 'seguridad', isPrimary: false },
    { key: 'area_oficinas', label: 'Área de Oficinas Interna', category: 'estructura', isPrimary: false },
    { key: 'mezzanine', label: 'Estructura Mezzanine', category: 'estructura', isPrimary: false },
    { key: 'bodega_interna', label: 'Bodega Interna', category: 'estructura', isPrimary: false },
    { key: 'uso_mixto', label: 'Uso de Suelo Mixto', category: 'extras', isPrimary: false },
    { key: 'acceso_24_7', label: 'Acceso Controlado 24/7', category: 'seguridad', isPrimary: false },
    { key: 'carga_descarga', label: 'Zona Carga y Descarga', category: 'seguridad', isPrimary: false },
    { key: 'vitrinas', label: 'Espacio para Vitrinas', category: 'estructura', isPrimary: false },
    { key: 'accesibilidad_universal', label: 'Rampa / Accesibilidad L7600', category: 'comodidad', isPrimary: false },
  ],
  beach: [
    // Primary
    { key: 'cerca_playa', label: 'Cerca de la Playa (Caminando)', category: 'ubicacion', isPrimary: true },
    { key: 'piscina', label: 'Piscina Privada', category: 'amenidades', isPrimary: true },
    { key: 'aire_acondicionado', label: 'Aire Acondicionado', category: 'comodidad', isPrimary: true },
    { key: 'amueblado', label: 'Totalmente Equipado / Amueblado', category: 'comodidad', isPrimary: true },
    { key: 'terraza', label: 'Terraza Amplia Exterior', category: 'estructura', isPrimary: true },
    { key: 'vista_mar', label: 'Vista al Mar Espectacular', category: 'ubicacion', isPrimary: true },
    
    // Secondary
    { key: 'bbq', label: 'Área BBQ / Rancho', category: 'amenidades', isPrimary: false },
    { key: 'permite_mascotas', label: 'Pet Friendly / Mascotas Ok', category: 'comodidad', isPrimary: false },
    { key: 'seguridad', label: 'Seguridad / Vigilancia', category: 'seguridad', isPrimary: false },
    { key: 'corto_plazo', label: 'Apto Alquiler Corto Plazo', category: 'extras', isPrimary: false },
    { key: 'cochera', label: 'Cochera Techada', category: 'estructura', isPrimary: false },
    { key: 'ducha_exterior', label: 'Ducha Exterior Post-Playa', category: 'comodidad', isPrimary: false },
    { key: 'acceso_turistico', label: 'Cerca de Zona Comercial Turística', category: 'ubicacion', isPrimary: false },
  ],
  other: [
    { key: 'permite_mascotas', label: 'Permite Mascotas', category: 'comodidad', isPrimary: true },
    { key: 'amueblado', label: 'Amueblado', category: 'comodidad', isPrimary: true },
    { key: 'en_condominio', label: 'En Condominio', category: 'estructura', isPrimary: true },
    { key: 'seguridad', label: 'Seguridad', category: 'seguridad', isPrimary: true },
  ],
};

/**
 * Validates features against a specific property type.
 * Filters out features that are not defined for that type.
 */
export function validateFeaturesForType(propertyType: string, features: string[]): string[] {
  const allowed = MASTER_FEATURES[propertyType] || MASTER_FEATURES.other;
  const allowedKeys = allowed.map((f) => f.key);
  return features.filter((key) => allowedKeys.includes(key));
}

/**
 * Groups features allowed for a property type into their categories.
 */
export function groupFeaturesByCategory(propertyType: string) {
  const allowed = MASTER_FEATURES[propertyType] || MASTER_FEATURES.other;
  const groups: Record<string, FeatureDefinition[]> = {};

  allowed.forEach((feat) => {
    if (!groups[feat.category]) {
      groups[feat.category] = [];
    }
    groups[feat.category].push(feat);
  });

  return groups;
}

/**
 * Resolves a list of feature keys into their definitions.
 */
export function resolveFeatures(propertyType: string, keys: string[]): FeatureDefinition[] {
  const allowed = MASTER_FEATURES[propertyType] || MASTER_FEATURES.other;
  return allowed.filter((feat) => keys.includes(feat.key));
}
