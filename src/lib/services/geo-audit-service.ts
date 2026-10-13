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
  distanceKm: number | null;
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
  'sao vicente': { lat: -23.9631, lng: -46.3919 },
  'são vicente': { lat: -23.9631, lng: -46.3919 },
  'cubatao': { lat: -23.8950, lng: -46.4253 },
  'cubatão': { lat: -23.8950, lng: -46.4253 },
  'bertioga': { lat: -23.8544, lng: -46.1389 },
  'praia grande': { lat: -24.0058, lng: -46.4028 },
  'guaruja': { lat: -23.9931, lng: -46.2564 },
  'guarujá': { lat: -23.9931, lng: -46.2564 },
  'sao paulo': { lat: -23.5505, lng: -46.6333 },
  'são paulo': { lat: -23.5505, lng: -46.6333 },
  'guarulhos': { lat: -23.4542, lng: -46.5333 },
  'sao bernardo do campo': { lat: -23.6944, lng: -46.5653 },
  'são bernardo do campo': { lat: -23.6944, lng: -46.5653 },
  'santo andre': { lat: -23.6639, lng: -46.5383 },
  'santo andré': { lat: -23.6639, lng: -46.5383 },
  'osasco': { lat: -23.5329, lng: -46.7917 },
  'diadema': { lat: -23.6865, lng: -46.6234 },
  'maua': { lat: -23.6678, lng: -46.4614 },
  'mauá': { lat: -23.6678, lng: -46.4614 },
  'barueri': { lat: -23.5111, lng: -46.8764 },
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
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'niteroi': { lat: -22.8832, lng: -43.1034 },
  'niterói': { lat: -22.8832, lng: -43.1034 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  'contagem': { lat: -19.9386, lng: -44.0539 },
  'betim': { lat: -19.9678, lng: -44.1983 },
  'uberlandia': { lat: -18.9186, lng: -48.2772 },
  'uberlândia': { lat: -18.9186, lng: -48.2772 },
  'juiz de fora': { lat: -21.7595, lng: -43.3498 },
  'sao joao del rei': { lat: -21.1356, lng: -44.2617 },
  'são joão del rei': { lat: -21.1356, lng: -44.2617 },
  'sao joao del-rei': { lat: -21.1356, lng: -44.2617 },
  'são joão del-rei': { lat: -21.1356, lng: -44.2617 },
  'divinopolis': { lat: -20.1444, lng: -44.8908 },
  'divinópolis': { lat: -20.1444, lng: -44.8908 },
  'ipatinga': { lat: -19.4683, lng: -42.5367 },
  'sete lagoas': { lat: -19.4608, lng: -44.2467 },
  'pocos de caldas': { lat: -21.7878, lng: -46.5614 },
  'poços de caldas': { lat: -21.7878, lng: -46.5614 },
  'pouso alegre': { lat: -22.2300, lng: -45.9364 },
  'varginha': { lat: -21.5517, lng: -45.4300 },
  'curitiba': { lat: -25.4284, lng: -49.2733 },
  'londrina': { lat: -23.3103, lng: -51.1628 },
  'porto alegre': { lat: -30.0346, lng: -51.2177 },
  'caxias do sul': { lat: -29.1678, lng: -51.1794 },
  'florianopolis': { lat: -27.5954, lng: -48.5480 },
  'florianópolis': { lat: -27.5954, lng: -48.5480 },
  'salvador': { lat: -12.9777, lng: -38.5016 },
  'recife': { lat: -8.0476, lng: -34.8770 },
  'fortaleza': { lat: -3.7172, lng: -38.5433 },
  'brasilia': { lat: -15.7975, lng: -47.8919 },
  'brasília': { lat: -15.7975, lng: -47.8919 },
  'goiania': { lat: -16.6869, lng: -49.2648 },
  'goiânia': { lat: -16.6869, lng: -49.2648 },
  'vitoria': { lat: -20.3155, lng: -40.3128 },
  'vitória': { lat: -20.3155, lng: -40.3128 }
};

/**
 * Matriz de Conurbações e Regiões Metropolitanas para tolerância de deslocamento habitual
 */
export const METROPOLITAN_REGIONS: Record<string, string[]> = {
  baixada_santista: [
    'santos', 'sao vicente', 'praia grande', 'guaruja', 'cubatao', 'bertioga', 'mongagua', 'itanhaem', 'peruibe'
  ],
  grande_sp: [
    'sao paulo', 'guarulhos', 'sao bernardo do campo', 'santo andre', 'osasco', 'maua', 'mogi das cruzes', 
    'diadema', 'carapicuiba', 'barueri', 'cotia', 'taboao da serra', 'embu das artes', 'itapevi', 
    'sao caetano do sul', 'santana de parnaiba', 'suzano', 'itaquaquecetuba', 'ribeirao pires', 'aruja', 'jundiai'
  ],
  grande_rio: [
    'rio de janeiro', 'niteroi', 'sao goncalo', 'duque de caxias', 'nova iguacu', 'belford roxo', 
    'sao joao de meriti', 'nilopolis', 'mesquita', 'mage', 'itaborai', 'marica'
  ],
  rmc_campinas: [
    'campinas', 'sumare', 'hortolandia', 'americana', "santa barbara d'oeste", 'indaiatuba', 
    'paulinia', 'valinhos', 'vinhedo', 'jaguariuna', 'nova odessa'
  ],
  grande_bh: [
    'belo horizonte', 'contagem', 'betim', 'nova lima', 'santa luzia', 'ibirite', 'ribeirao das neves', 'sabara'
  ],
  grande_curitiba: [
    'curitiba', 'sao jose dos pinhais', 'colombo', 'pinhais', 'araucaria', 'fazenda rio grande'
  ],
  grande_porto_alegre: [
    'porto alegre', 'canoas', 'novo hamburgo', 'sao leopoldo', 'gravatai', 'viamao', 'alvorada', 'esteio', 'sapucaia do sul'
  ],
  distrito_federal: [
    'brasilia', 'taguatinga', 'ceilandia', 'aguas claras', 'valparaiso de goias', 'aguas lindas de goias'
  ]
};

/**
 * Raio base mínimo de tolerância para deslocamentos rotineiros intermunicipais vizinhos (em km)
 */
export const BASE_CONURBATION_TOLERANCE_KM = 50;

/**
 * Verifica se duas cidades pertencem à mesma conurbação / região metropolitana
 */
export function isSameConurbation(cityA: string, cityB: string): boolean {
  const normA = cityA.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const normB = cityB.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (normA === normB) return true;

  for (const region of Object.values(METROPOLITAN_REGIONS)) {
    const hasA = region.some(c => normA.includes(c) || c.includes(normA));
    const hasB = region.some(c => normB.includes(c) || c.includes(normB));
    if (hasA && hasB) {
      return true;
    }
  }

  return false;
}

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
 * Normaliza e identifica a cidade a partir de um texto de endereço.
 * Retorna null se não houver cidade identificável no texto (evita fallbacks arbitrários).
 */
export function extractCityFromAddress(address?: string | null): string | null {
  if (!address || !address.trim()) return null;
  const normalized = address.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  for (const city of Object.keys(BRAZIL_CITY_COORDINATES)) {
    const cleanCity = city.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalized.includes(cleanCity)) {
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  // Fallback para padrão "Cidade - UF" ou "Cidade/UF"
  const match = address.match(/(?:em|de|[\-,])\s*([A-Za-zÀ-ÿ\s]{3,25})\s*(?:[\/-]\s*[A-Z]{2}|\b)/i);
  if (match && match[1]) {
    const candidate = match[1].trim();
    if (candidate.length >= 3 && !candidate.toLowerCase().includes('rua') && !candidate.toLowerCase().includes('av')) {
      return candidate;
    }
  }

  return null;
}

/**
 * Executa a Auditoria Geográfica de Atendimento (Geo-Shield)
 * Incorpora tolerância para Regiões Metropolitanas / conurbações e raio base de 50 km.
 */
export function auditGeoDistance(input: GeoAuditInput): GeoAuditResult {
  const workCity = extractCityFromAddress(input.employeeWorkCity);
  const clinicCity = extractCityFromAddress(input.clinicAddressOrCity);

  // Se uma das localidades não pôde ser determinada, não inventa distância
  if (!workCity || !clinicCity) {
    return {
      hasAddonActive: true,
      isCompatible: true,
      distanceKm: null,
      clinicCity: clinicCity || 'Não informada no atestado',
      workCity: workCity || input.employeeWorkCity || 'Não informada no cadastro',
      telemedicineDetected: !!input.isTelemedicine
    };
  }

  const workKey = workCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const clinicKey = clinicCity.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const coordsWork = BRAZIL_CITY_COORDINATES[workKey];
  const coordsClinic = BRAZIL_CITY_COORDINATES[clinicKey];

  // Se uma das cidades não tiver coordenadas conhecidas
  if (!coordsWork || !coordsClinic) {
    return {
      hasAddonActive: true,
      isCompatible: true,
      distanceKm: null,
      clinicCity,
      workCity,
      telemedicineDetected: !!input.isTelemedicine
    };
  }

  // 1. Se são a mesma cidade: compatibilidade total imediata
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

  // 2. Distância rodoviária estimada (~1.25x distância em linha reta)
  const straightLine = calculateHaversineDistance(
    coordsWork.lat,
    coordsWork.lng,
    coordsClinic.lat,
    coordsClinic.lng
  );
  const estimatedRoadKm = Math.round(straightLine * 1.25);

  // 3. Checagem de Conurbação / Região Metropolitana
  const isSameMetro = isSameConurbation(workCity, clinicCity);

  // Raio efetivo respeita o configurado na empresa, com piso mínimo de 50km
  const effectiveThreshold = Math.max(input.distanceThresholdKm || 100, BASE_CONURBATION_TOLERANCE_KM);

  // 4. Critério de Compatibilidade:
  // - Telemedicina declarada dispensa deslocamento presencial
  // - Cidades dentro da mesma Região Metropolitana / conurbação são compatíveis (deslocamento urbano habitual)
  // - Distâncias dentro do raio de tolerância base são compatíveis
  const isCompatible = !!input.isTelemedicine || isSameMetro || estimatedRoadKm <= effectiveThreshold;

  let alert: GeoAuditResult['alert'];
  if (!isCompatible) {
    const isVeryFar = estimatedRoadKm > 250;
    alert = {
      severity: isVeryFar ? 'CRITICAL' : 'WARNING',
      title: 'Incompatibilidade Geográfica de Atendimento Presencial',
      description: `O atendimento presencial ocorreu em ${clinicCity} (~${estimatedRoadKm} km de ${workCity}), fora da região metropolitana habitual de trabalho do colaborador.`,
      recommendation: 'Recomenda-se confirmar se o colaborador estava em trânsito/férias ou se a consulta foi realizada via telemedicina.'
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
