import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserConfig,
  saveUserConfig,
  updateUserConfig,
  getFlows,
  saveFlows,
} from './storage';
import { Flow, UserConfig } from '../engine/types';

describe('storage service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getUserConfig', () => {
    const DEFAULT_CONFIG: UserConfig = {
      capacity: 5,
      language: 'pt-BR',
      onboardingDone: false,
    };

    it('returns DEFAULT_CONFIG when no config is stored in localStorage', () => {
      const config = getUserConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('returns merged config with DEFAULT_CONFIG when valid JSON is stored', () => {
      const storedConfig = { capacity: 10, onboardingDone: true };
      localStorage.setItem('vurio:user_config', JSON.stringify(storedConfig));

      const config = getUserConfig();
      expect(config).toEqual({
        ...DEFAULT_CONFIG,
        capacity: 10,
        onboardingDone: true,
      });
    });

    it('returns DEFAULT_CONFIG when localStorage contains invalid JSON string (error path)', () => {
      localStorage.setItem('vurio:user_config', 'invalid-json-{');

      const config = getUserConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });

    it('returns DEFAULT_CONFIG when localStorage.getItem throws an exception (error path)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Access denied');
      });

      const config = getUserConfig();
      expect(config).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('saveUserConfig', () => {
    it('persists the given config to localStorage as JSON', () => {
      const customConfig: UserConfig = {
        capacity: 12,
        language: 'en-US',
        onboardingDone: true,
      };

      saveUserConfig(customConfig);

      const raw = localStorage.getItem('vurio:user_config');
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(customConfig);
    });
  });

  describe('updateUserConfig', () => {
    it('updates partial properties and preserves existing user config', () => {
      const initial: UserConfig = {
        capacity: 8,
        language: 'pt-BR',
        onboardingDone: true,
      };
      saveUserConfig(initial);

      const updated = updateUserConfig({ capacity: 20 });

      expect(updated).toEqual({
        capacity: 20,
        language: 'pt-BR',
        onboardingDone: true,
      });

      const raw = localStorage.getItem('vurio:user_config');
      expect(JSON.parse(raw!)).toEqual(updated);
    });
  });

  describe('getFlows', () => {
    it('returns an empty array when no flows are stored in localStorage', () => {
      const flows = getFlows();
      expect(flows).toEqual([]);
    });

    it('returns parsed flows when valid JSON array is stored in localStorage', () => {
      const mockFlows: Flow[] = [
        {
          id: 'flow-1',
          description: 'Test Flow Description',
          status: 'entrada',
          position: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];
      localStorage.setItem('vurio:flows', JSON.stringify(mockFlows));

      const flows = getFlows();
      expect(flows).toEqual(mockFlows);
    });

    it('returns an empty array when stored flows JSON is invalid (error path)', () => {
      localStorage.setItem('vurio:flows', 'corrupted-data-[');

      const flows = getFlows();
      expect(flows).toEqual([]);
    });

    it('returns an empty array when localStorage.getItem throws an exception (error path)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage access error');
      });

      const flows = getFlows();
      expect(flows).toEqual([]);
    });
  });

  describe('saveFlows', () => {
    it('persists flows array to localStorage as JSON', () => {
      const mockFlows: Flow[] = [
        {
          id: 'flow-1',
          description: 'Flow 1 Description',
          status: 'entrada',
          position: 1,
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ];

      saveFlows(mockFlows);

      const raw = localStorage.getItem('vurio:flows');
      expect(raw).not.toBeNull();
      expect(JSON.parse(raw!)).toEqual(mockFlows);
    });
  });
});
