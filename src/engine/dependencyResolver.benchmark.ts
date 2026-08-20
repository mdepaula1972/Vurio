import { simulateDelayConsequences } from './dependencyResolver';
import { Process, Step } from './types';

function createDummyProcess(numSteps: number, branchFactor: number = 3): Process {
  const steps: Step[] = [];

  for (let i = 0; i < numSteps; i++) {
    const id = `step_${i}`;
    const dependencies = [];

    if (i > 0) {
      // Connect to previous nodes based on branchFactor
      for (let b = 1; b <= branchFactor; b++) {
        const parentIdx = i - b;
        if (parentIdx >= 0) {
          dependencies.push({
            dependsOnStepId: `step_${parentIdx}`,
            type: 'sequential' as const
          });
        }
      }
    }

    steps.push({
      id,
      title: `Step ${i}`,
      description: `Description ${i}`,
      layer: Math.floor(i / 10) + 1,
      status: 'not_started',
      responsible: ['User'],
      dependencies
    });
  }

  return {
    id: 'proc_1',
    name: 'Benchmark Process',
    category: 'Test',
    description: 'Test process for benchmark',
    isActive: true,
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: [],
    tags: []
  };
}

// Verification test
function runVerification() {
  const testProc: Process = {
    id: 'p1',
    name: 'Test Process',
    category: 'Test',
    description: 'Test',
    isActive: true,
    steps: [
      { id: 'A', title: 'Step A', description: '', layer: 1, status: 'not_started', responsible: [], dependencies: [] },
      { id: 'B', title: 'Step B', description: '', layer: 2, status: 'not_started', responsible: [], dependencies: [{ dependsOnStepId: 'A', type: 'sequential' }] },
      { id: 'C', title: 'Step C', description: '', layer: 2, status: 'not_started', responsible: [], dependencies: [{ dependsOnStepId: 'A', type: 'sequential' }] },
      { id: 'D', title: 'Step D', description: '', layer: 3, status: 'not_started', responsible: [], dependencies: [{ dependsOnStepId: 'B', type: 'sequential' }] },
      { id: 'E', title: 'Step E', description: '', layer: 4, status: 'not_started', responsible: [], dependencies: [{ dependsOnStepId: 'D', type: 'sequential' }, { dependsOnStepId: 'C', type: 'sequential' }] },
    ],
    createdAt: '',
    updatedAt: '',
    participants: [],
    tags: []
  };

  const resA = simulateDelayConsequences('A', 2, testProc);
  console.log('Verification resA impacted:', resA.impactedStepIds.sort());
  const expectedA = ['B', 'C', 'D', 'E'];
  const passA = JSON.stringify(resA.impactedStepIds.sort()) === JSON.stringify(expectedA);
  console.log('Test A pass:', passA);

  const resB = simulateDelayConsequences('B', 2, testProc);
  console.log('Verification resB impacted:', resB.impactedStepIds.sort());
  const expectedB = ['D', 'E'];
  const passB = JSON.stringify(resB.impactedStepIds.sort()) === JSON.stringify(expectedB);
  console.log('Test B pass:', passB);

  const resE = simulateDelayConsequences('E', 2, testProc);
  console.log('Verification resE impacted:', resE.impactedStepIds.sort());
  const expectedE: string[] = [];
  const passE = JSON.stringify(resE.impactedStepIds.sort()) === JSON.stringify(expectedE);
  console.log('Test E pass:', passE);

  if (!passA || !passB || !passE) {
    throw new Error('Verification failed!');
  }
}

function runBenchmark() {
  const numSteps = 1500;
  const process = createDummyProcess(numSteps, 2);

  // Warmup
  for (let i = 0; i < 10; i++) {
    simulateDelayConsequences('step_0', 1, process);
  }

  const iterations = 50;
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    simulateDelayConsequences('step_0', 1, process);
    simulateDelayConsequences('step_100', 1, process);
    simulateDelayConsequences('step_500', 1, process);
  }

  const endTime = performance.now();
  const totalMs = endTime - startTime;
  const avgMs = totalMs / (iterations * 3);

  console.log(`Benchmark completed: total ${totalMs.toFixed(2)}ms across ${iterations * 3} runs.`);
  console.log(`Average time per call (${numSteps} steps process): ${avgMs.toFixed(4)}ms`);
}

runVerification();
runBenchmark();
