// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFlows,
  saveFlows,
  getUserConfig,
  saveUserConfig,
  updateUserConfig,
} from './storage';
import { Flow, UserConfig } from '../engine/types';

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getFlows', () => {
    it('should return empty array when no flows are stored', () => {
      expect(getFlows()).toEqual([]);
    });

    it('should return array of flows when stored in localStorage', () => {
      const mockFlows: Flow[] = [
        {
          id: 'flow-1',
          description: 'Test Flow 1',
          status: 'entrada',
          position: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];
      localStorage.setItem('vurio:flows', JSON.stringify(mockFlows));

      const flows = getFlows();
      expect(flows).toEqual(mockFlows);
    });

    it('should handle corrupted JSON and return empty array', () => {
      localStorage.setItem('vurio:flows', 'invalid-json-{');

      const flows = getFlows();
      expect(flows).toEqual([]);
    });
  });

  describe('saveFlows', () => {
    it('should save flows array to localStorage', () => {
      const mockFlows: Flow[] = [
        {
          id: 'flow-1',
          description: 'Saved Flow',
          status: 'entrada',
          position: 0,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      saveFlows(mockFlows);

      const stored = localStorage.getItem('vurio:flows');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(mockFlows);
    });
  });

  describe('getUserConfig', () => {
    it('should return default config when no config is stored', () => {
      const config = getUserConfig();
      expect(config).toEqual({
        capacity: 5,
        language: 'pt-BR',
        onboardingDone: false,
      });
    });

    it('should return stored config merged with defaults', () => {
      localStorage.setItem(
        'vurio:user_config',
        JSON.stringify({ capacity: 10, onboardingDone: true })
      );

      const config = getUserConfig();
      expect(config).toEqual({
        capacity: 10,
        language: 'pt-BR',
        onboardingDone: true,
      });
    });

    it('should handle corrupted JSON and return default config', () => {
      localStorage.setItem('vurio:user_config', '{corrupted');

      const config = getUserConfig();
      expect(config).toEqual({
        capacity: 5,
        language: 'pt-BR',
        onboardingDone: false,
      });
    });
  });

  describe('saveUserConfig', () => {
    it('should save user config to localStorage', () => {
      const config: UserConfig = {
        capacity: 8,
        language: 'en-US',
        onboardingDone: true,
      };

      saveUserConfig(config);

      const stored = localStorage.getItem('vurio:user_config');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(config);
    });
  });

  describe('updateUserConfig', () => {
    it('should update partial user config and return updated full config', () => {
      const updated = updateUserConfig({ onboardingDone: true });

      expect(updated).toEqual({
        capacity: 5,
        language: 'pt-BR',
        onboardingDone: true,
      });

      const storedConfig = getUserConfig();
      expect(storedConfig.onboardingDone).toBe(true);
    });

    it('should merge new partial config with previously saved config', () => {
      saveUserConfig({
        capacity: 10,
        language: 'es-ES',
        onboardingDone: false,
      });

      const updated = updateUserConfig({ onboardingDone: true, capacity: 12 });

      expect(updated).toEqual({
        capacity: 12,
        language: 'es-ES',
        onboardingDone: true,
      });

      expect(getUserConfig()).toEqual({
        capacity: 12,
        language: 'es-ES',
        onboardingDone: true,
      });
    });
  });
});
