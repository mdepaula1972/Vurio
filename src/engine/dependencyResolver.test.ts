import { resolveProcessState } from './dependencyResolver';
import { Process } from './types';

function runTests() {
  console.log('Running unit tests for resolveProcessState...');

  // Test 1: Step behavior with dependencies
  const mockProcess: Process = {
    id: 'proc-1',
    name: 'Test Process',
    category: 'Test',
    description: 'Test process description',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: [],
    tags: [],
    steps: [
      {
        id: 'step-1',
        title: 'Step 1',
        description: 'First step',
        layer: 1,
        status: 'completed',
        responsible: ['Alice'],
        dependencies: []
      },
      {
        id: 'step-2',
        title: 'Step 2',
        description: 'Second step',
        layer: 1,
        status: 'not_started',
        responsible: ['Bob'],
        dependencies: [
          { dependsOnStepId: 'step-1', type: 'sequential' }
        ]
      },
      {
        id: 'step-3',
        title: 'Step 3',
        description: 'Third step',
        layer: 1,
        status: 'in_progress',
        responsible: ['Charlie'],
        dependencies: [
          { dependsOnStepId: 'step-1', type: 'sequential' },
          { dependsOnStepId: 'step-2', type: 'sequential' }
        ]
      }
    ]
  };

  const resolved = resolveProcessState(mockProcess);

  if (resolved.steps.length !== 3) throw new Error('Expected 3 steps');
  if (resolved.steps[0].status !== 'completed') throw new Error('Expected step 1 to be completed');
  if (resolved.steps[1].status !== 'in_progress') throw new Error('Expected step 2 to be in_progress');
  if (resolved.steps[2].status !== 'blocked') throw new Error('Expected step 3 to be blocked');

  if (!resolved.metrics) throw new Error('Expected metrics to exist');
  if (typeof resolved.metrics.healthScore !== 'number') throw new Error('Expected healthScore to be number');
  if (resolved.metrics.criticalPathCount !== 1) throw new Error('Expected criticalPathCount to be 1');

  // Test 2: Metrics calculation correctness
  const completedCount = resolved.steps.filter(s => s.status === 'completed').length; // 1
  const blockedCount = resolved.steps.filter(s => s.status === 'blocked').length; // 1
  const inProgressCount = resolved.steps.filter(s => s.status === 'in_progress').length; // 1
  if (completedCount !== 1) throw new Error('Expected completedCount 1');
  if (blockedCount !== 1) throw new Error('Expected blockedCount 1');
  if (inProgressCount !== 1) throw new Error('Expected inProgressCount 1');

  // Test 3: Empty steps array edge case
  const emptyProcess: Process = {
    ...mockProcess,
    steps: []
  };

  const resolvedEmpty = resolveProcessState(emptyProcess);
  if (resolvedEmpty.steps.length !== 0) throw new Error('Expected empty steps');
  if (resolvedEmpty.metrics?.criticalPathCount !== 0) throw new Error('Expected criticalPathCount 0');
  if (resolvedEmpty.metrics?.healthScore !== 10) throw new Error('Expected healthScore 10');

  console.log('✅ All unit tests passed!');
}

runTests();
