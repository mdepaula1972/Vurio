import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlows } from './useFlows';
import { getFlows } from '../services/storage';

describe('useFlows', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('addFlow', () => {
    it('throws error when description is empty string', () => {
      const { result } = renderHook(() => useFlows());

      expect(() => {
        act(() => {
          result.current.addFlow('');
        });
      }).toThrow('A descrição não pode estar vazia');
    });

    it('throws error when description contains only whitespace', () => {
      const { result } = renderHook(() => useFlows());

      expect(() => {
        act(() => {
          result.current.addFlow('   ');
        });
      }).toThrow('A descrição não pode estar vazia');
    });

    it('successfully adds a new flow with valid description', () => {
      const { result } = renderHook(() => useFlows());

      let newFlow;
      act(() => {
        newFlow = result.current.addFlow('Fluxo Teste');
      });

      expect(newFlow).toBeDefined();
      expect(newFlow?.description).toBe('Fluxo Teste');
      expect(newFlow?.status).toBe('entrada');
      expect(result.current.flows).toHaveLength(1);
      expect(result.current.flows[0].description).toBe('Fluxo Teste');
      expect(result.current.flows[0].position).toBe(1);
    });

    it('trims whitespace from valid description', () => {
      const { result } = renderHook(() => useFlows());

      let newFlow;
      act(() => {
        newFlow = result.current.addFlow('   Fluxo Com Espaços   ');
      });

      expect(newFlow?.description).toBe('Fluxo Com Espaços');
      expect(result.current.flows[0].description).toBe('Fluxo Com Espaços');
    });

    it('repositions existing flows when a new flow is added', () => {
      const { result } = renderHook(() => useFlows());

      act(() => {
        result.current.addFlow('Primeiro');
      });
      act(() => {
        result.current.addFlow('Segundo');
      });

      expect(result.current.flows).toHaveLength(2);
      expect(result.current.flows[0].description).toBe('Segundo');
      expect(result.current.flows[0].position).toBe(1);
      expect(result.current.flows[1].description).toBe('Primeiro');
      expect(result.current.flows[1].position).toBe(2);
    });

    it('persists added flows to localStorage', () => {
      const { result } = renderHook(() => useFlows());

      act(() => {
        result.current.addFlow('Persistência');
      });

      const storedFlows = getFlows();
      expect(storedFlows).toHaveLength(1);
      expect(storedFlows[0].description).toBe('Persistência');
    });
  });

  describe('removeFlow', () => {
    it('removes flow by id and updates positions', () => {
      const { result } = renderHook(() => useFlows());

      let flow1, flow2;
      act(() => {
        flow1 = result.current.addFlow('Primeiro');
        flow2 = result.current.addFlow('Segundo');
      });

      expect(result.current.flows).toHaveLength(2);

      act(() => {
        result.current.removeFlow(flow2!.id);
      });

      expect(result.current.flows).toHaveLength(1);
      expect(result.current.flows[0].id).toBe(flow1!.id);
      expect(result.current.flows[0].position).toBe(1);

      const storedFlows = getFlows();
      expect(storedFlows).toHaveLength(1);
      expect(storedFlows[0].id).toBe(flow1!.id);
    });
  });
});
