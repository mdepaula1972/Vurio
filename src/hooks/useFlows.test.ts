import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlows } from './useFlows';
import * as storage from '../services/storage';
import { Flow } from '../engine/types';

vi.mock('../services/storage', () => ({
  getFlows: vi.fn(),
  saveFlows: vi.fn(),
}));

describe('useFlows', () => {
  const initialFlows: Flow[] = [
    {
      id: 'flow-1',
      description: 'Flow 1',
      status: 'entrada',
      position: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'flow-2',
      description: 'Flow 2',
      status: 'entrada',
      position: 2,
      createdAt: '2026-01-01T01:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.getFlows).mockReturnValue([...initialFlows]);
  });

  it('should initialize flows from storage', () => {
    const { result } = renderHook(() => useFlows());

    expect(storage.getFlows).toHaveBeenCalledTimes(1);
    expect(result.current.flows).toEqual(initialFlows);
  });

  describe('addFlow', () => {
    it('should add a new flow, place it at position 1, shift existing positions, and persist to storage', () => {
      const { result } = renderHook(() => useFlows());

      let createdFlow: Flow | undefined;
      act(() => {
        createdFlow = result.current.addFlow('  Novo Fluxo  ');
      });

      expect(createdFlow).toBeDefined();
      expect(createdFlow?.description).toBe('Novo Fluxo');
      expect(createdFlow?.status).toBe('entrada');
      expect(createdFlow?.id).toMatch(/^flow-\d+-[a-z0-9]+$/);
      expect(createdFlow?.createdAt).toBeTruthy();

      // Check hook state
      expect(result.current.flows).toHaveLength(3);
      expect(result.current.flows[0]).toEqual({
        ...createdFlow,
        position: 1,
      });
      expect(result.current.flows[1]).toEqual({
        ...initialFlows[0],
        position: 2,
      });
      expect(result.current.flows[2]).toEqual({
        ...initialFlows[1],
        position: 3,
      });

      // Check storage persistence
      expect(storage.saveFlows).toHaveBeenCalledWith(result.current.flows);
    });

    it('should throw an error when description is empty or whitespace-only', () => {
      const { result } = renderHook(() => useFlows());

      expect(() => {
        act(() => {
          result.current.addFlow('');
        });
      }).toThrow('A descrição não pode estar vazia');

      expect(() => {
        act(() => {
          result.current.addFlow('   ');
        });
      }).toThrow('A descrição não pode estar vazia');

      expect(storage.saveFlows).not.toHaveBeenCalled();
    });
  });

  describe('removeFlow', () => {
    it('should remove a flow by ID, recalculate positions, and persist to storage', () => {
      const { result } = renderHook(() => useFlows());

      act(() => {
        result.current.removeFlow('flow-1');
      });

      expect(result.current.flows).toHaveLength(1);
      expect(result.current.flows[0]).toEqual({
        ...initialFlows[1],
        position: 1,
      });

      expect(storage.saveFlows).toHaveBeenCalledWith(result.current.flows);
    });

    it('should handle removing non-existent flow ID gracefully', () => {
      const { result } = renderHook(() => useFlows());

      act(() => {
        result.current.removeFlow('non-existent-id');
      });

      expect(result.current.flows).toHaveLength(2);
      expect(result.current.flows).toEqual(initialFlows);
      expect(storage.saveFlows).toHaveBeenCalledWith(initialFlows);
    });
  });
});
