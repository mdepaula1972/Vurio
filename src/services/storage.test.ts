import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    vi.restoreAllMocks();
  });

  describe('getFlows', () => {
    it('returns empty array when localStorage has no flows item', () => {
      expect(getFlows()).toEqual([]);
    });

    it('returns parsed flows when localStorage contains valid flow JSON', () => {
      const mockFlows: Flow[] = [
        {
          id: 'flow-1',
          description: 'Flow description',
          status: 'entrada',
          position: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      localStorage.setItem('vurio:flows', JSON.stringify(mockFlows));

      expect(getFlows()).toEqual(mockFlows);
    });

    it('returns empty array when localStorage contains invalid JSON (error path)', () => {
      localStorage.setItem('vurio:flows', 'invalid json');

      expect(getFlows()).toEqual([]);
    });

    it('returns empty array when localStorage.getItem throws an exception (error path)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(getFlows()).toEqual([]);
    });
  });

  describe('saveFlows', () => {
    it('saves flows array to localStorage as JSON string', () => {
      const mockFlows: Flow[] = [
        {
          id: 'flow-1',
          description: 'Flow description',
          status: 'entrada',
          position: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];

      saveFlows(mockFlows);

      const stored = localStorage.getItem('vurio:flows');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(mockFlows);
    });
  });

  describe('getUserConfig', () => {
    it('returns default config when localStorage has no user config item', () => {
      expect(getUserConfig()).toEqual({
        capacity: 5,
        language: 'pt-BR',
        onboardingDone: false,
      });
    });

    it('returns merged config when valid user config exists in localStorage', () => {
      localStorage.setItem(
        'vurio:user_config',
        JSON.stringify({ capacity: 10, onboardingDone: true })
      );

      expect(getUserConfig()).toEqual({
        capacity: 10,
        language: 'pt-BR',
        onboardingDone: true,
      });
    });

    it('returns default config when localStorage contains invalid JSON (error path)', () => {
      localStorage.setItem('vurio:user_config', '{invalid-json');

      expect(getUserConfig()).toEqual({
        capacity: 5,
        language: 'pt-BR',
        onboardingDone: false,
      });
    });

    it('returns default config when localStorage.getItem throws an exception (error path)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      expect(getUserConfig()).toEqual({
        capacity: 5,
        language: 'pt-BR',
        onboardingDone: false,
      });
    });
  });

  describe('saveUserConfig', () => {
    it('saves user config to localStorage', () => {
      const config: UserConfig = {
        capacity: 8,
        language: 'en-US',
        onboardingDone: true,
      };

      saveUserConfig(config);

      const stored = localStorage.getItem('vurio:user_config');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(config);
    });
  });

  describe('updateUserConfig', () => {
    it('updates partial user config and saves it to localStorage', () => {
      const initial: UserConfig = {
        capacity: 5,
        language: 'pt-BR',
        onboardingDone: false,
      };
      saveUserConfig(initial);

      const result = updateUserConfig({ capacity: 12, onboardingDone: true });

      expect(result).toEqual({
        capacity: 12,
        language: 'pt-BR',
        onboardingDone: true,
      });
      expect(getUserConfig()).toEqual({
        capacity: 12,
        language: 'pt-BR',
        onboardingDone: true,
      });
    });
  });
});
