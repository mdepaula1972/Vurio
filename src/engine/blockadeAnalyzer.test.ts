import { describe, it, expect } from 'vitest';
import { analyzeStepBlockade } from './blockadeAnalyzer';
import { Step, Process } from './types';

describe('analyzeStepBlockade', () => {
  const baseProcess: Process = {
    id: 'proc-1',
    name: 'Processo Teste',
    category: 'Geral',
    description: 'Processo de teste',
    isActive: true,
    steps: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    participants: ['Alice'],
    tags: ['teste']
  };

  const createStep = (overrides: Partial<Step>): Step => ({
    id: 'step-1',
    title: 'Etapa 1',
    description: 'Descrição 1',
    layer: 1,
    status: 'in_progress',
    responsible: ['Alice'],
    dependencies: [],
    ...overrides
  });

  it('returns unblocked info when step status is completed', () => {
    const step = createStep({ status: 'completed' });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [step] });

    expect(result.isBlocked).toBe(false);
    expect(result.reason).toBe('Etapa concluída com sucesso.');
    expect(result.missingCondition).toBe('Nenhuma');
    expect(result.responsibleParties).toEqual([]);
    expect(result.processImpact).toBe('Nenhum impacto negativo. Etapa finalizada.');
    expect(result.aiRecommendation).toBe('Prosseguir para as etapas subsequentes que foram liberadas.');
  });

  it('handles unknown dependency step IDs gracefully', () => {
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'step-unknown', type: 'sequential' }]
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [step] });

    expect(result.isBlocked).toBe(false);
    expect(result.reason).toBe('Nenhum bloqueio. Etapa pronta para ser executada.');
  });

  it('detects sequential dependency blockade', () => {
    const parentStep = createStep({ id: 'parent-1', title: 'Parent Step', status: 'in_progress', responsible: ['Bob'] });
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'parent-1', type: 'sequential' }]
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [parentStep, step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Pré-requisito sequencial pendente: "Parent Step" não foi concluída.');
    expect(result.missingCondition).toContain('Conclusão da etapa "Parent Step" (Status atual: in_progress)');
    expect(result.processImpact).toContain('O fluxo principal do processo está retido');
    expect(result.aiRecommendation).toContain('Solicite a Bob para finalizar "Parent Step".');
    expect(result.responsibleParties).toContain('Alice');
    expect(result.responsibleParties).toContain('Bob');
  });

  it('detects convergent dependency blockade', () => {
    const parentStep = createStep({ id: 'parent-1', title: 'Parent Step', status: 'not_started' });
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'parent-1', type: 'convergent' }]
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [parentStep, step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Etapa convergente aguardando múltiplas frentes.');
    expect(result.missingCondition).toContain('Conclusão e fusão de dados');
    expect(result.processImpact).toContain('Decisões consolidadas não podem ser tomadas');
  });

  it('detects conditional dependency blockade', () => {
    const parentStep = createStep({ id: 'parent-1', title: 'Parent Step', status: 'not_started' });
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'parent-1', type: 'conditional', conditionExpression: 'Aprovação > 50%' }]
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [parentStep, step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Condição de desvio não atendida: "Aprovação > 50%"');
    expect(result.missingCondition).toBe('Aprovação > 50%');
  });

  it('detects financial dependency blockade', () => {
    const parentStep = createStep({ id: 'parent-1', title: 'Parent Step', status: 'not_started' });
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'parent-1', type: 'financial' }],
      financialCriteria: { requiredBudget: 5000, isApproved: false }
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [parentStep, step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Bloqueio financeiro: A etapa depende da validação de orçamento/caixa');
    expect(result.missingCondition).toContain('5.000');
  });

  it('detects external dependency blockade', () => {
    const parentStep = createStep({ id: 'parent-1', title: 'Parent Step', status: 'not_started' });
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'parent-1', type: 'external' }],
      externalCriteria: { partyName: 'Fornecedor X', actionRequired: 'Enviar contrato', isFulfilled: false }
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [parentStep, step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Aguardando ação externa do cliente/fornecedor: Fornecedor X.');
    expect(result.missingCondition).toBe('Enviar contrato');
  });

  it('detects default/unknown dependency type blockade', () => {
    const parentStep = createStep({ id: 'parent-1', title: 'Parent Step', status: 'not_started' });
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'parent-1', type: 'hierarchical' }]
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [parentStep, step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Aguardando a conclusão da etapa dependente "Parent Step".');
  });

  it('detects own financial criteria blockade when dependencies are satisfied', () => {
    const parentStep = createStep({ id: 'parent-1', title: 'Parent Step', status: 'completed' });
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'parent-1', type: 'sequential' }],
      financialCriteria: { requiredBudget: 10000, isApproved: false }
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [parentStep, step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Aguardando liberação do orçamento de R$ 10.000');
    expect(result.missingCondition).toBe('Aprovação financeira explícita.');
  });

  it('detects own external criteria blockade', () => {
    const step = createStep({
      externalCriteria: { partyName: 'Banco ABC', actionRequired: 'Aprovação de crédito', isFulfilled: false }
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Dependência externa pendente: Banco ABC');
    expect(result.missingCondition).toBe('Aprovação de crédito');
  });

  it('detects human approval blockade', () => {
    const step = createStep({
      approval: {
        type: 'two_responsible',
        approvedBy: ['Alice'],
        requiredApprovers: ['Alice', 'Bob'],
        totalRequired: 2
      }
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [step] });

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Aprovação humana necessária (two_responsible): 1 de 2 aprovações registradas.');
    expect(result.missingCondition).toContain('Bob');
  });

  it('returns unblocked info when all criteria are satisfied', () => {
    const parentStep = createStep({ id: 'parent-1', title: 'Parent Step', status: 'completed' });
    const step = createStep({
      dependencies: [{ dependsOnStepId: 'parent-1', type: 'sequential' }],
      financialCriteria: { requiredBudget: 1000, isApproved: true },
      externalCriteria: { partyName: 'Cliente', actionRequired: 'Assinar termo', isFulfilled: true },
      approval: { type: 'individual', approvedBy: ['Alice'], requiredApprovers: ['Alice'], totalRequired: 1 }
    });
    const result = analyzeStepBlockade(step, { ...baseProcess, steps: [parentStep, step] });

    expect(result.isBlocked).toBe(false);
    expect(result.reason).toBe('Nenhum bloqueio. Etapa pronta para ser executada.');
    expect(result.missingCondition).toBe('Condições satisfeitas.');
    expect(result.processImpact).toBe('Pronto para avanço.');
    expect(result.aiRecommendation).toBe('Executar etapa e marcar como concluída.');
  });
});
