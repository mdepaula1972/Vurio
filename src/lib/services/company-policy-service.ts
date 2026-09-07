/**
 * Vurio - Serviço de Políticas e Configurações de RH / DP por Empresa
 * Armazena e gerencia parâmetros de tolerância da Convenção Coletiva (CCT), localidade e status de Add-ons.
 */

export interface CompanyPolicyConfig {
  companyId: string;
  companyName: string;
  // Política de Apresentação Retroativa
  maxRetroactiveHours: number; // Ex: 48h (2 dias), 72h (3 dias), 120h (5 dias)
  
  // Localidade de Trabalho para Geo-Shield
  workCity: string; // Ex: "Santos/SP" ou "São Paulo/SP"
  workState: string; // "SP"
  geoShieldEnabled: boolean; // Add-on ativo ou inativo
  maxAllowedDistanceKm: number; // Tolerância máxima em km (padrão: 100km)
  
  // Limites e Notificações
  autoReferralInssDays: number; // Padrão: 15 dias (Lei 8.213/91)
  notifyOnCriticalDivergence: boolean;
  updatedAt: string;
}

// Configuração padrão de referência
const DEFAULT_POLICY: CompanyPolicyConfig = {
  companyId: 'default',
  companyName: 'Minha Empresa S/A',
  maxRetroactiveHours: 48, // 48 horas (padrão de mercado em convenções sindicais)
  workCity: 'Santos',
  workState: 'SP',
  geoShieldEnabled: true,
  maxAllowedDistanceKm: 100,
  autoReferralInssDays: 15,
  notifyOnCriticalDivergence: true,
  updatedAt: new Date().toISOString()
};

let inMemoryConfig: CompanyPolicyConfig = { ...DEFAULT_POLICY };

export function getCompanyPolicy(companyId?: string): CompanyPolicyConfig {
  return inMemoryConfig;
}

export function updateCompanyPolicy(newConfig: Partial<CompanyPolicyConfig>): CompanyPolicyConfig {
  inMemoryConfig = {
    ...inMemoryConfig,
    ...newConfig,
    updatedAt: new Date().toISOString()
  };
  return inMemoryConfig;
}
