/**
 * Constantes de versionamento centralizadas da aplicação Vurio.
 * Utilizadas no frontend, cabeçalhos de resposta HTTP, diagnóstico pericial e deploy Vercel.
 */
export const APP_VERSION = 'v1.4.7';
export const APP_BUILD_DATE = '12/10/2026';
export const APP_ENGINE_NAME = 'Vurio DP Workstation';
export const APP_VERSION_LABEL = `${APP_ENGINE_NAME} ${APP_VERSION} • Leitor Bidirecional CFM & Multi-Camada OCR • Build ${APP_BUILD_DATE}`;

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
      'SPLIT_VIEW_VALIDATION_WORKSTATION',
      'LIVE_CFM_CRM_VERIFICATION',
      'PERMANENT_EMPLOYEE_FOLDER_CPF',
      'PREDICTIVE_ABSENTEEISM_CALENDAR',
      'NOTABLE_DP_EVENTS_MANAGER',
      'NEUTRAL_ALERTS_ENGINE',
      'PADES_ICP_BRASIL_INTEGRITY',
      'PDFIUM_BROWSER_DETECTOR'
    ],
    status: 'OPERATIONAL',
    timestamp: new Date().toISOString()
  };
}
