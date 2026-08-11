/**
 * Vurio v2.0.0 — MVP Fase 1
 * storage.ts — Abstração de localStorage para persistência de dados
 */
import { Flow, UserConfig } from '../engine/types';

const KEYS = {
  FLOWS: 'vurio:flows',
  USER_CONFIG: 'vurio:user_config',
} as const;

// ─── Flows ────────────────────────────────────────────────────────────────────

export function getFlows(): Flow[] {
  try {
    const raw = localStorage.getItem(KEYS.FLOWS);
    if (!raw) return [];
    return JSON.parse(raw) as Flow[];
  } catch {
    return [];
  }
}

export function saveFlows(flows: Flow[]): void {
  localStorage.setItem(KEYS.FLOWS, JSON.stringify(flows));
}

// ─── User Config ──────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: UserConfig = {
  capacity: 5,
  language: 'pt-BR',
  onboardingDone: false,
};

export function getUserConfig(): UserConfig {
  try {
    const raw = localStorage.getItem(KEYS.USER_CONFIG);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as UserConfig;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveUserConfig(config: UserConfig): void {
  localStorage.setItem(KEYS.USER_CONFIG, JSON.stringify(config));
}

export function updateUserConfig(partial: Partial<UserConfig>): UserConfig {
  const current = getUserConfig();
  const updated = { ...current, ...partial };
  saveUserConfig(updated);
  return updated;
}
