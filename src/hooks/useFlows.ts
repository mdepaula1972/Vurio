/**
 * Vurio v2.0.0 — MVP Fase 1
 * useFlows.ts — Hook de gerenciamento de estado + persistência dos fluxos
 */
import { useState, useCallback } from 'react';
import { Flow } from '../engine/types';
import { getFlows, saveFlows } from '../services/storage';

function generateId(): string {
  return `flow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useFlows() {
  const [flows, setFlows] = useState<Flow[]>(() => getFlows());

  const addFlow = useCallback((description: string): Flow => {
    const trimmed = description.trim();
    if (!trimmed) throw new Error('A descrição não pode estar vazia');

    const newFlow: Flow = {
      id: generateId(),
      description: trimmed,
      status: 'entrada',
      position: 0, // será recalculado abaixo
      createdAt: new Date().toISOString(),
    };

    setFlows(prev => {
      // Posição = o fluxo mais novo fica no topo (position 1)
      const repositioned = prev.map(f => ({ ...f, position: f.position + 1 }));
      const updated = [{ ...newFlow, position: 1 }, ...repositioned];
      saveFlows(updated);
      return updated;
    });

    return newFlow;
  }, []);

  const removeFlow = useCallback((id: string) => {
    setFlows(prev => {
      const filtered = prev.filter(f => f.id !== id);
      // Reposicionar
      const updated = filtered.map((f, idx) => ({ ...f, position: idx + 1 }));
      saveFlows(updated);
      return updated;
    });
  }, []);

  return { flows, addFlow, removeFlow };
}
