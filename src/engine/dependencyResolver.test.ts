import { describe, it, expect } from 'vitest';
import { resolveProcessState, groupStepsByLayer, simulateDelayConsequences } from './dependencyResolver';
import { Process, Step } from './types';

describe('dependencyResolver', () => {
  const createMockStep = (overrides: Partial<Step> = {}): Step => ({
    id: 'step-1',
    title: 'Test Step',
    description: 'Test step description',
    layer: 1,
    status: 'not_started',
    responsible: ['User 1'],
    dependencies: [],
    ...overrides,
  });

  const createMockProcess = (steps: Step[] = []): Process => ({
    id: 'proc-1',
    name: 'Test Process',
    category: 'Operations',
    description: 'Test process description',
    isActive: true,
    steps,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    participants: ['User 1'],
    tags: ['test'],
  });

  describe('resolveProcessState', () => {
    it('preserves status and sets blockadeInfo for completed steps', () => {
      const step = createMockStep({ id: 's1', status: 'completed' });
      const process = createMockProcess([step]);

      const result = resolveProcessState(process);

      expect(result.steps[0].status).toBe('completed');
      expect(result.steps[0].blockadeInfo).toEqual({
        isBlocked: false,
        reason: 'Etapa finalizada com sucesso.',
        missingCondition: 'Nenhuma',
        responsibleParties: [],
        processImpact: 'Sem impacto negativo.',
        aiRecommendation: 'Avançar para próximas etapas.',
      });
    });

    it('marks step as blocked if dependent step is not completed', () => {
      const step1 = createMockStep({ id: 's1', status: 'not_started', title: 'Step 1' });
      const step2 = createMockStep({
        id: 's2',
        status: 'not_started',
        title: 'Step 2',
        dependencies: [{ dependsOnStepId: 's1', type: 'sequential' }],
      });
      const process = createMockProcess([step1, step2]);

      const result = resolveProcessState(process);

      expect(result.steps[1].status).toBe('blocked');
      expect(result.steps[1].blockadeInfo?.isBlocked).toBe(true);
    });

    it('transitions step from blocked or not_started to in_progress when no blockade exists', () => {
      const step1 = createMockStep({ id: 's1', status: 'not_started' });
      const step2 = createMockStep({ id: 's2', status: 'blocked' });
      const process = createMockProcess([step1, step2]);

      const result = resolveProcessState(process);

      expect(result.steps[0].status).toBe('in_progress');
      expect(result.steps[1].status).toBe('in_progress');
    });

    it('calculates healthScore, metrics, and updates updatedAt timestamp', () => {
      const step1 = createMockStep({ id: 's1', status: 'completed' });
      const step2 = createMockStep({
        id: 's2',
        status: 'not_started',
        dependencies: [
          { dependsOnStepId: 's1', type: 'sequential' },
          { dependsOnStepId: 's3', type: 'sequential' },
        ],
      });
      const step3 = createMockStep({ id: 's3', status: 'not_started' });

      const process = createMockProcess([step1, step2, step3]);

      const result = resolveProcessState(process);

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.criticalPathCount).toBe(1); // step2 has 2 dependencies (>1)
      expect(typeof result.metrics?.healthScore).toBe('number');
      expect(result.metrics!.healthScore).toBeGreaterThanOrEqual(10);
      expect(result.metrics!.healthScore).toBeLessThanOrEqual(100);
      expect(result.updatedAt).not.toBe(process.updatedAt);
    });

    it('handles empty process steps correctly', () => {
      const process = createMockProcess([]);

      const result = resolveProcessState(process);

      expect(result.steps).toEqual([]);
      expect(result.metrics?.healthScore).toBe(10); // clamped min is 10
      expect(result.metrics?.timeSavedHours).toBe(2);
      expect(result.metrics?.criticalPathCount).toBe(0);
    });

    it('clamps healthScore to min 10 and max 100', () => {
      // 10 blocked steps depending on a non-completed parent step -> raw score formula gives negative number, clamped to 10
      const parentStep = createMockStep({ id: 'parent', status: 'not_started' });
      const blockedSteps = Array.from({ length: 10 }, (_, i) =>
        createMockStep({
          id: `s${i + 1}`,
          status: 'not_started',
          dependencies: [{ dependsOnStepId: 'parent', type: 'sequential' }],
        })
      );
      const blockedProcess = createMockProcess([parentStep, ...blockedSteps]);
      const blockedResult = resolveProcessState(blockedProcess);
      expect(blockedResult.metrics?.healthScore).toBe(10);

      // 10 completed steps -> raw score formula gives 100
      const completedSteps = Array.from({ length: 10 }, (_, i) =>
        createMockStep({ id: `s${i + 1}`, status: 'completed' })
      );
      const completedProcess = createMockProcess(completedSteps);
      const completedResult = resolveProcessState(completedProcess);
      expect(completedResult.metrics?.healthScore).toBe(100);
    });
  });

  describe('groupStepsByLayer', () => {
    it('groups steps by their layer property', () => {
      const step1 = createMockStep({ id: 's1', layer: 1 });
      const step2 = createMockStep({ id: 's2', layer: 2 });
      const step3 = createMockStep({ id: 's3', layer: 1 });

      const grouped = groupStepsByLayer([step1, step2, step3]);

      expect(grouped.size).toBe(2);
      expect(grouped.get(1)).toEqual([step1, step3]);
      expect(grouped.get(2)).toEqual([step2]);
    });

    it('defaults layer to 1 when layer is missing or falsy', () => {
      const step1 = createMockStep({ id: 's1', layer: undefined as any });
      const step2 = createMockStep({ id: 's2', layer: 0 as any });

      const grouped = groupStepsByLayer([step1, step2]);

      expect(grouped.size).toBe(1);
      expect(grouped.get(1)).toEqual([step1, step2]);
    });

    it('handles empty step array', () => {
      const grouped = groupStepsByLayer([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('simulateDelayConsequences', () => {
    it('transitively calculates all downstream impacted steps', () => {
      const step1 = createMockStep({ id: 's1', title: 'Step 1' });
      const step2 = createMockStep({
        id: 's2',
        title: 'Step 2',
        dependencies: [{ dependsOnStepId: 's1', type: 'sequential' }],
      });
      const step3 = createMockStep({
        id: 's3',
        title: 'Step 3',
        dependencies: [{ dependsOnStepId: 's2', type: 'sequential' }],
      });
      const step4 = createMockStep({ id: 's4', title: 'Step 4' }); // Unrelated step

      const process = createMockProcess([step1, step2, step3, step4]);

      const simulation = simulateDelayConsequences('s1', 3, process);

      expect(simulation.impactedStepIds).toEqual(['s2', 's3']);
      expect(simulation.totalDelayDays).toBe(3);
      expect(simulation.explanation).toContain('Um atraso de 3 dia(s) na etapa "Step 1"');
      expect(simulation.explanation).toContain('atrasará 2 etapa(s) dependente(s)');
    });

    it('returns empty impacted steps when step has no dependents', () => {
      const step1 = createMockStep({ id: 's1', title: 'Step 1' });
      const process = createMockProcess([step1]);

      const simulation = simulateDelayConsequences('s1', 5, process);

      expect(simulation.impactedStepIds).toEqual([]);
      expect(simulation.totalDelayDays).toBe(5);
      expect(simulation.explanation).toContain('atrasará 0 etapa(s) dependente(s)');
    });

    it('uses stepId in explanation fallback when target step is not found', () => {
      const process = createMockProcess([]);

      const simulation = simulateDelayConsequences('non-existent-id', 2, process);

      expect(simulation.impactedStepIds).toEqual([]);
      expect(simulation.explanation).toContain('etapa "non-existent-id"');
    });
  });
});
