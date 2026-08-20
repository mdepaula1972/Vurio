import { describe, it, expect } from 'vitest';
import { groupStepsByLayer } from './dependencyResolver';
import { Step } from './types';

describe('groupStepsByLayer', () => {
  const createMockStep = (id: string, layer?: number): Step => ({
    id,
    title: `Step ${id}`,
    description: `Description for ${id}`,
    layer: layer as number,
    status: 'not_started',
    responsible: ['User1'],
    dependencies: []
  });

  it('should return an empty map when given an empty array of steps', () => {
    const result = groupStepsByLayer([]);
    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
  });

  it('should correctly group steps by explicit layer numbers', () => {
    const step1 = createMockStep('1', 1);
    const step2 = createMockStep('2', 2);
    const step3 = createMockStep('3', 1);
    const step4 = createMockStep('4', 3);

    const steps = [step1, step2, step3, step4];
    const result = groupStepsByLayer(steps);

    expect(result.size).toBe(3);
    expect(result.get(1)).toEqual([step1, step3]);
    expect(result.get(2)).toEqual([step2]);
    expect(result.get(3)).toEqual([step4]);
  });

  it('should fallback to layer 1 when layer is undefined or 0', () => {
    const stepNoLayer = createMockStep('1'); // layer is undefined
    const stepZeroLayer = createMockStep('2', 0); // layer is 0
    const stepExplicitLayer = createMockStep('3', 2);

    const steps = [stepNoLayer, stepZeroLayer, stepExplicitLayer];
    const result = groupStepsByLayer(steps);

    expect(result.size).toBe(2);
    expect(result.get(1)).toEqual([stepNoLayer, stepZeroLayer]);
    expect(result.get(2)).toEqual([stepExplicitLayer]);
  });

  it('should preserve insertion order of steps within the same layer', () => {
    const stepA = createMockStep('A', 1);
    const stepB = createMockStep('B', 1);
    const stepC = createMockStep('C', 1);

    const result = groupStepsByLayer([stepA, stepB, stepC]);

    expect(result.get(1)).toEqual([stepA, stepB, stepC]);
  });
});
