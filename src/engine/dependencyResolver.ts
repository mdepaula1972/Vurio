/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * Motor de Resolução de Dependências e cálculo de estado dos processos
 */
import { Process, Step } from './types';
import { analyzeStepBlockade } from './blockadeAnalyzer';


/**
 * Executa a atualização completa do motor do Vurio:
 * 1. Recalcula os níveis de camada (layers)
 * 2. Atualiza o status de bloqueio de cada etapa com explicações detalhadas
 * 3. Identifica gargalos globais no processo
 */
export function resolveProcessState(process: Process): Process {
  const updatedSteps: Step[] = process.steps.map(step => {
    // Se a etapa já estiver concluída, mantemos seu status
    if (step.status === 'completed') {
      return {
        ...step,
        blockadeInfo: {
          isBlocked: false,
          reason: 'Etapa finalizada',
          missingCondition: 'Nenhuma',
          responsibleParties: [],
          processImpact: 'Sem impacto',
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

  return {
    ...process,
    steps: updatedSteps,
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
