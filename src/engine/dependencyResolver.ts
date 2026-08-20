/**
 * Vurio v1.3.0 — Gestor Inteligente de Processos com IA
 * Motor de Resolução de Dependências e cálculo de saúde operacional (Health Score)
 */
import { Process, Step, ProcessMetrics } from './types';
import { analyzeStepBlockade } from './blockadeAnalyzer';

/**
 * Executa a atualização completa do motor do Vurio:
 * 1. Recalcula os níveis de camada (layers)
 * 2. Atualiza o status de bloqueio de cada etapa com explicações detalhadas
 * 3. Identifica gargalos globais e calcula a Pontuação de Saúde Operacional (Health Score)
 */
export function resolveProcessState(process: Process): Process {
  const updatedSteps: Step[] = process.steps.map(step => {
    // Se a etapa já estiver concluída, mantemos seu status
    if (step.status === 'completed') {
      return {
        ...step,
        blockadeInfo: {
          isBlocked: false,
          reason: 'Etapa finalizada com sucesso.',
          missingCondition: 'Nenhuma',
          responsibleParties: [],
          processImpact: 'Sem impacto negativo.',
          aiRecommendation: 'Avançar para próximas etapas.'
        }
      };
    }

    // Analisa bloqueios de dependências e regras humanas
    const blockade = analyzeStepBlockade(step, process);

    let newStatus = step.status;
    if (blockade.isBlocked) {
      newStatus = 'blocked';
    } else if (step.status === 'blocked' || step.status === 'not_started') {
      newStatus = 'in_progress';
    }

    return {
      ...step,
      status: newStatus,
      blockadeInfo: blockade
    };
  });

  // Cálculo da Saúde Operacional do Processo (Health Score 0-100%)
  const total = updatedSteps.length || 1;
  let completed = 0;
  let blocked = 0;
  let inProgress = 0;
  let criticalPathCount = 0;

  for (const s of updatedSteps) {
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

  // Fórmula de Saúde: (Concluídas * 100 + Em Andamento * 60 - Bloqueadas * 30) / Total
  const rawScore = Math.round(((completed * 100) + (inProgress * 60) - (blocked * 30)) / total);
  const healthScore = Math.max(10, Math.min(100, rawScore));

  const metrics: ProcessMetrics = {
    healthScore,
    timeSavedHours: completed * 4.5 + (total - blocked) * 2,
    criticalPathCount
  };

  return {
    ...process,
    steps: updatedSteps,
    metrics,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Calcula a árvore de etapas agrupadas por camada (layer 1, layer 2, etc.)
 */
export function groupStepsByLayer(steps: Step[]): Map<number, Step[]> {
  const layerMap = new Map<number, Step[]>();
  
  steps.forEach(step => {
    const layer = step.layer || 1;
    if (!layerMap.has(layer)) {
      layerMap.set(layer, []);
    }
    layerMap.get(layer)!.push(step);
  });

  return layerMap;
}

/**
 * Simula as consequências de um atraso em uma etapa específica
 */
export function simulateDelayConsequences(stepId: string, delayDays: number, process: Process): {
  impactedStepIds: string[];
  totalDelayDays: number;
  explanation: string;
} {
  const impactedSet = new Set<string>();

  function findDependents(id: string) {
    process.steps.forEach(s => {
      if (s.dependencies.some(d => d.dependsOnStepId === id)) {
        if (!impactedSet.has(s.id)) {
          impactedSet.add(s.id);
          findDependents(s.id);
        }
      }
    });
  }

  findDependents(stepId);
  const targetStep = process.steps.find(s => s.id === stepId);

  return {
    impactedStepIds: Array.from(impactedSet),
    totalDelayDays: delayDays,
    explanation: `Um atraso de ${delayDays} dia(s) na etapa "${targetStep?.title || stepId}" causará o efeito cascata e atrasará ${impactedSet.size} etapa(s) dependente(s).`
  };
}
