/**
 * Constantes de versionamento centralizadas da aplicação Vurio.
 * Utilizadas no frontend, cabeçalhos de resposta HTTP, diagnóstico pericial e deploy Vercel.
 */
export const APP_VERSION = 'v1.3.0';
export const APP_BUILD_DATE = '12/10/2026';
export const APP_ENGINE_NAME = 'Vurio DP & Absenteísmo Engine';
export const APP_VERSION_LABEL = `${APP_ENGINE_NAME} ${APP_VERSION} • Build ${APP_BUILD_DATE} • Módulo DP Ativo`;

export interface AppVersionInfo {
  version: string;
  engine: string;
  buildDate: string;
  modules: string[];
  status: 'OPERATIONAL' | 'MAINTENANCE';
  timestamp: string;
}

export function getAppVersionInfo(): AppVersionInfo {
  return {
    version: APP_VERSION,
    engine: APP_ENGINE_NAME,
    buildDate: APP_BUILD_DATE,
    modules: [
      'PADES_ICP_BRASIL_INTEGRITY',
      'CFM_REGISTRY_LIVE_AUDIT',
      'GEO_SHIELD_DISTANCE_AUDIT',
      'PDFIUM_BROWSER_DETECTOR',
      'DP_ABSENTEEISM_PREDICTIVE_ENGINE',
      'ASSISTED_TYPING_CFM_LOOKUP'
    ],
    status: 'OPERATIONAL',
    timestamp: new Date().toISOString()
  };
}
