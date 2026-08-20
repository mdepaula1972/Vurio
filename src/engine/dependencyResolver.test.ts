import { describe, it, expect } from 'vitest';
import {
  simulateDelayConsequences,
  groupStepsByLayer,
  resolveProcessState
} from './dependencyResolver';
import { Process, Step } from './types';

function createMockStep(
  id: string,
  title: string,
  dependencies: string[] = [],
  layer: number = 1,
  status: Step['status'] = 'not_started'
): Step {
  return {
    id,
    title,
    description: `Description for ${title}`,
    layer,
    status,
    responsible: ['User1'],
    dependencies: dependencies.map(depId => ({
      dependsOnStepId: depId,
      type: 'sequential'
    }))
  };
}

function createMockProcess(steps: Step[]): Process {
  return {
    id: 'proc-1',
    name: 'Test Process',
    category: 'Testing',
    description: 'Process for testing dependency resolver',
    isActive: true,
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: ['User1'],
    tags: ['test']
  };
}

describe('dependencyResolver', () => {
  describe('simulateDelayConsequences', () => {
    it('should calculate delay impacts for a linear dependency chain (A -> B -> C)', () => {
      const stepA = createMockStep('step-a', 'Step A');
      const stepB = createMockStep('step-b', 'Step B', ['step-a']);
      const stepC = createMockStep('step-c', 'Step C', ['step-b']);
      const process = createMockProcess([stepA, stepB, stepC]);

      // Delay on root step A
      const resultA = simulateDelayConsequences('step-a', 5, process);
      expect(resultA.impactedStepIds).toEqual(['step-b', 'step-c']);
      expect(resultA.totalDelayDays).toBe(5);
      expect(resultA.explanation).toBe(
        'Um atraso de 5 dia(s) na etapa "Step A" causará o efeito cascata e atrasará 2 etapa(s) dependente(s).'
      );

      // Delay on middle step B
      const resultB = simulateDelayConsequences('step-b', 3, process);
      expect(resultB.impactedStepIds).toEqual(['step-c']);
      expect(resultB.totalDelayDays).toBe(3);
      expect(resultB.explanation).toBe(
        'Um atraso de 3 dia(s) na etapa "Step B" causará o efeito cascata e atrasará 1 etapa(s) dependente(s).'
      );

      // Delay on leaf step C
      const resultC = simulateDelayConsequences('step-c', 2, process);
      expect(resultC.impactedStepIds).toEqual([]);
      expect(resultC.totalDelayDays).toBe(2);
      expect(resultC.explanation).toBe(
        'Um atraso de 2 dia(s) na etapa "Step C" causará o efeito cascata e atrasará 0 etapa(s) dependente(s).'
      );
    });

    it('should calculate delay impacts for branching dependencies (A -> B, A -> C)', () => {
      const stepA = createMockStep('step-a', 'Step A');
      const stepB = createMockStep('step-b', 'Step B', ['step-a']);
      const stepC = createMockStep('step-c', 'Step C', ['step-a']);
      const process = createMockProcess([stepA, stepB, stepC]);

      const result = simulateDelayConsequences('step-a', 4, process);
      expect(result.impactedStepIds).toContain('step-b');
      expect(result.impactedStepIds).toContain('step-c');
      expect(result.impactedStepIds).toHaveLength(2);
      expect(result.totalDelayDays).toBe(4);
    });

    it('should calculate delay impacts for diamond dependencies (A -> B, A -> C, B -> D, C -> D) without duplicate impacted step IDs', () => {
      const stepA = createMockStep('step-a', 'Step A');
      const stepB = createMockStep('step-b', 'Step B', ['step-a']);
      const stepC = createMockStep('step-c', 'Step C', ['step-a']);
      const stepD = createMockStep('step-d', 'Step D', ['step-b', 'step-c']);
      const process = createMockProcess([stepA, stepB, stepC, stepD]);

      const result = simulateDelayConsequences('step-a', 7, process);
      expect(result.impactedStepIds).toEqual(
        expect.arrayContaining(['step-b', 'step-c', 'step-d'])
      );
      expect(result.impactedStepIds).toHaveLength(3);
    });

    it('should handle circular dependencies gracefully without infinite recursion', () => {
      const stepA = createMockStep('step-a', 'Step A', ['step-b']);
      const stepB = createMockStep('step-b', 'Step B', ['step-a']);
      const process = createMockProcess([stepA, stepB]);

      const result = simulateDelayConsequences('step-a', 10, process);
      expect(result.impactedStepIds).toEqual(
        expect.arrayContaining(['step-b', 'step-a'])
      );
      expect(result.impactedStepIds).toHaveLength(2);
    });

    it('should handle non-existent stepId and fallback to stepId in explanation', () => {
      const stepA = createMockStep('step-a', 'Step A');
      const process = createMockProcess([stepA]);

      const result = simulateDelayConsequences('non-existent-id', 2, process);
      expect(result.impactedStepIds).toEqual([]);
      expect(result.totalDelayDays).toBe(2);
      expect(result.explanation).toContain('non-existent-id');
    });
  });

  describe('groupStepsByLayer', () => {
    it('should group steps by layer correctly', () => {
      const step1 = createMockStep('s1', 'Step 1', [], 1);
      const step2 = createMockStep('s2', 'Step 2', [], 1);
      const step3 = createMockStep('s3', 'Step 3', [], 2);
      const step4 = createMockStep('s4', 'Step 4', [], 3);

      const layerMap = groupStepsByLayer([step1, step2, step3, step4]);
      expect(layerMap.get(1)).toEqual([step1, step2]);
      expect(layerMap.get(2)).toEqual([step3]);
      expect(layerMap.get(3)).toEqual([step4]);
    });

    it('should default to layer 1 if step layer is undefined', () => {
      const step = createMockStep('s1', 'Step 1');
      delete (step as Partial<Step>).layer;

      const layerMap = groupStepsByLayer([step]);
      expect(layerMap.get(1)).toEqual([step]);
    });
  });

  describe('resolveProcessState', () => {
    it('should preserve completed status and calculate health score', () => {
      const step1 = createMockStep('s1', 'Step 1', [], 1, 'completed');
      const step2 = createMockStep('s2', 'Step 2', ['s1'], 2, 'not_started');
      const process = createMockProcess([step1, step2]);

      const updatedProcess = resolveProcessState(process);

      expect(updatedProcess.steps[0].status).toBe('completed');
      expect(updatedProcess.steps[0].blockadeInfo?.isBlocked).toBe(false);
      expect(updatedProcess.metrics).toBeDefined();
      expect(updatedProcess.metrics?.healthScore).toBeGreaterThanOrEqual(10);
      expect(updatedProcess.metrics?.healthScore).toBeLessThanOrEqual(100);
    });
  });
});
