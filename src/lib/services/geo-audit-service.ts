/**
 * Vurio - Módulo Add-on: Geo-Shield (Auditoria Geográfica de Deslocamento)
 * Valida a compatibilidade entre o local de trabalho/moradia do colaborador e o endereço de atendimento do médico/clínica.
 * Atua como barreira contra o comércio clandestino de atestados à distância (jurisprudência TST / Art. 482 CLT).
 */

export interface GeoAuditInput {
  clinicAddressOrCity: string;
  employeeWorkCity: string; // Ex: 'Santos' ou 'Santos/SP'
  employeeResidenceCity?: string; // Ex: 'Praia Grande'
  isTelemedicine?: boolean;
  distanceThresholdKm?: number; // Padrão: 100km
}

export interface GeoAuditResult {
  hasAddonActive: boolean;
  isCompatible: boolean;
  distanceKm: number;
  clinicCity: string;
  workCity: string;
  telemedicineDetected: boolean;
  alert?: {
    severity: 'WARNING' | 'CRITICAL';
    title: string;
    description: string;
    recommendation: string;
  };
}

// Coordenadas aproximadas dos principais polos de trabalho e cidades para cálculo geodésico
const BRAZIL_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'santos': { lat: -23.9618, lng: -46.3322 },
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  'são paulo': { lat: -23.5505, lng: -46.6333 },
  'campinas': { lat: -22.9056, lng: -47.0608 },
  'ribeirao preto': { lat: -21.1775, lng: -47.8103 },
  'ribeirão preto': { lat: -21.1775, lng: -47.8103 },
  'sao jose dos campos': { lat: -23.1896, lng: -45.8841 },
  'são josé dos campos': { lat: -23.1896, lng: -45.8841 },
  'sorocaba': { lat: -23.5015, lng: -47.4526 },
  'bauru': { lat: -22.3147, lng: -49.0606 },
  'sao jose do rio preto': { lat: -20.8113, lng: -49.3758 },
  'são josé do rio preto': { lat: -20.8113, lng: -49.3758 },
  'piracicaba': { lat: -22.7253, lng: -47.6492 },
  'jundiai': { lat: -23.1864, lng: -46.8842 },
  'jundiaí': { lat: -23.1864, lng: -46.8842 },
  'praia grande': { lat: -24.0058, lng: -46.4028 },
  'guaruja': { lat: -23.9931, lng: -46.2564 },
  'guarujá': { lat: -23.9931, lng: -46.2564 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'niteroi': { lat: -22.8832, lng: -43.1034 },
  'niterói': { lat: -22.8832, lng: -43.1034 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  'curitiba': { lat: -25.4284, lng: -49.2733 },
  'porto alegre': { lat: -30.0346, lng: -51.2177 },
  'salvador': { lat: -12.9777, lng: -38.5016 },
  'brasilia': { lat: -15.7975, lng: -47.8919 },
  'brasília': { lat: -15.7975, lng: -47.8919 },
};

/**
 * Fórmula de Haversine para cálculo de distância em linha reta entre duas coordenadas (km)
 */
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Normaliza e identifica a cidade a partir de um texto de endereço
 */
export function extractCityFromAddress(address: string): string {
  const normalized = address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const city of Object.keys(BRAZIL_CITY_COORDINATES)) {
    const cleanCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(cleanCity)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  // Fallback: extração padrão "Cidade - UF" ou "Cidade/UF"
  const match = address.match(/(?:em|de|[\-,])\s*([A-Za-zÀ-ÿ\s]{3,25})\s*(?:[\/-]\s*[A-Z]{2}|\b)/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return 'São Paulo';
}

/**
 * Executa a Auditoria Geográfica de Atendimento (Geo-Shield)
 */
export function auditGeoDistance(input: GeoAuditInput): GeoAuditResult {
  const threshold = input.distanceThresholdKm || 100;
  const workCity = extractCityFromAddress(input.employeeWorkCity);
  const clinicCity = extractCityFromAddress(input.clinicAddressOrCity);

  const workKey = workCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const clinicKey = clinicCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const coordsWork = BRAZIL_CITY_COORDINATES[workKey] || BRAZIL_CITY_COORDINATES['sao paulo'];
  const coordsClinic = BRAZIL_CITY_COORDINATES[clinicKey] || BRAZIL_CITY_COORDINATES['sao paulo'];

  // Se são a mesma cidade
  if (workKey === clinicKey) {
    return {
      hasAddonActive: true,
      isCompatible: true,
      distanceKm: 0,
      clinicCity,
      workCity,
      telemedicineDetected: !!input.isTelemedicine
    };
  }

  // Distância rodoviária estimada (~1.2x distância em linha reta)
  const straightLine = calculateHaversineDistance(
    coordsWork.lat,
    coordsWork.lng,
    coordsClinic.lat,
    coordsClinic.lng
  );
  const estimatedRoadKm = Math.round(straightLine * 1.25);

  const isCompatible = estimatedRoadKm <= threshold || !!input.isTelemedicine;

  let alert: GeoAuditResult['alert'];
  if (!isCompatible) {
    const isVeryFar = estimatedRoadKm > 250;
    alert = {
      severity: isVeryFar ? 'CRITICAL' : 'WARNING',
      title: 'Incompatibilidade Geográfica de Atendimento Presencial',
      description: `O atendimento presencial ocorreu em ${clinicCity} (~${estimatedRoadKm} km de ${workCity}), divergindo da localidade habitual de trabalho do colaborador.`,
      recommendation: 'Recomenda-se confirmar se o colaborador estava em deslocamento/férias ou se o atendimento foi realizado via telemedicina.'
    };
  }

  return {
    hasAddonActive: true,
    isCompatible,
    distanceKm: estimatedRoadKm,
    clinicCity,
    workCity,
    telemedicineDetected: !!input.isTelemedicine,
    alert
  };
}
