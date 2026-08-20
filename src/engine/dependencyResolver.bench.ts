import { resolveProcessState } from './dependencyResolver';
import { Process, Step } from './types';

function generateLargeProcess(numSteps: number): Process {
  const steps: Step[] = [];
  for (let i = 0; i < numSteps; i++) {
    const statusChoices: Step['status'][] = ['completed', 'in_progress', 'not_started', 'blocked'];
    const status = statusChoices[i % 4];

    const dependencies = [];
    if (i >= 2) {
      dependencies.push({ dependsOnStepId: `step-${i - 1}`, type: 'sequential' as const });
      if (i % 2 === 0) {
        dependencies.push({ dependsOnStepId: `step-${i - 2}`, type: 'sequential' as const });
      }
    }

    steps.push({
      id: `step-${i}`,
      title: `Step ${i}`,
      description: `Description for step ${i}`,
      layer: Math.floor(i / 10) + 1,
      status,
      responsible: [`User${i % 5}`],
      dependencies
    });
  }

  return {
    id: 'bench-proc-1',
    name: 'Benchmark Process',
    category: 'Benchmark',
    description: 'Process generated for benchmark',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: ['User1', 'User2'],
    tags: ['bench'],
    steps
  };
}

// Microbenchmark specifically measuring metrics computation logic vs original 4 filter passes
function runMetricsBenchmark() {
  const process = generateLargeProcess(5000);
  const steps = process.steps;
  const iterations = 10000;

  console.log('--- Benchmarking Metrics Extraction (5,000 steps, 10,000 iterations) ---');

  // Baseline 4-filter implementation
  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    const total = steps.length || 1;
    const completed = steps.filter(s => s.status === 'completed').length;
    const blocked = steps.filter(s => s.status === 'blocked').length;
    const inProgress = steps.filter(s => s.status === 'in_progress').length;
    const criticalPathCount = steps.filter(s => s.dependencies.length > 1).length;
    // prevent optimization/dead code elimination
    if (completed + blocked + inProgress + criticalPathCount < 0) console.log(total);
  }
  const timeOld = performance.now() - startOld;

  // Optimized single-pass implementation
  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
    const total = steps.length || 1;
    let completed = 0;
    let blocked = 0;
    let inProgress = 0;
    let criticalPathCount = 0;

    for (const s of steps) {
      if (s.status === 'completed') {
        completed++;
      } else if (s.status === 'blocked') {
        blocked++;
      } else if (s.status === 'in_progress') {
        inProgress++;
      }

      if (s.dependencies.length > 1) {
        criticalPathCount++;
      }
    }
    // prevent optimization/dead code elimination
    if (completed + blocked + inProgress + criticalPathCount + total < 0) console.log(total);
  }
  const timeNew = performance.now() - startNew;

  console.log(`Original 4-filter passes: ${timeOld.toFixed(2)}ms`);
  console.log(`Optimized single-pass loop: ${timeNew.toFixed(2)}ms`);
  const improvement = ((timeOld - timeNew) / timeOld) * 100;
  console.log(`Metrics extraction speedup: ${improvement.toFixed(2)}% faster`);
  console.log('-------------------------------------------------------------------');
}

runMetricsBenchmark();
