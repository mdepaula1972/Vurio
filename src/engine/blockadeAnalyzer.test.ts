import { describe, it, expect } from 'vitest';
import { analyzeStepBlockade } from './blockadeAnalyzer';
import { Step, Process } from './types';

describe('analyzeStepBlockade', () => {
  const createBaseProcess = (steps: Step[] = []): Process => ({
    id: 'proc-1',
    name: 'Test Process',
    category: 'Testing',
    description: 'Process for testing',
    isActive: true,
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: ['User A'],
    tags: ['test']
  });

  const createBaseStep = (overrides: Partial<Step> = {}): Step => ({
    id: 'step-1',
    title: 'Test Step',
    description: 'A step for testing',
    layer: 1,
    status: 'in_progress',
    responsible: ['User A'],
    dependencies: [],
    ...overrides
  });

  it('returns no blockade for a completed step', () => {
    const completedStep = createBaseStep({
      status: 'completed'
    });
    const process = createBaseProcess([completedStep]);

    const result = analyzeStepBlockade(completedStep, process);

    expect(result.isBlocked).toBe(false);
    expect(result.reason).toBe('Etapa concluída com sucesso.');
    expect(result.missingCondition).toBe('Nenhuma');
    expect(result.responsibleParties).toEqual([]);
    expect(result.processImpact).toBe('Nenhum impacto negativo. Etapa finalizada.');
    expect(result.aiRecommendation).toBe('Prosseguir para as etapas subsequentes que foram liberadas.');
  });

  it('returns no blockade for an active step with no dependencies or requirements', () => {
    const step = createBaseStep({
      status: 'in_progress'
    });
    const process = createBaseProcess([step]);

    const result = analyzeStepBlockade(step, process);

    expect(result.isBlocked).toBe(false);
    expect(result.reason).toBe('Nenhum bloqueio. Etapa pronta para ser executada.');
    expect(result.missingCondition).toBe('Condições satisfeitas.');
    expect(result.responsibleParties).toEqual(['User A']);
  });

  it('identifies sequential dependency blockade when parent step is incomplete', () => {
    const parentStep = createBaseStep({
      id: 'step-parent',
      title: 'Parent Step',
      status: 'in_progress',
      responsible: ['User B']
    });
    const step = createBaseStep({
      id: 'step-child',
      dependencies: [
        {
          dependsOnStepId: 'step-parent',
          type: 'sequential'
        }
      ]
    });
    const process = createBaseProcess([parentStep, step]);

    const result = analyzeStepBlockade(step, process);

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Pré-requisito sequencial pendente');
    expect(result.responsibleParties).toContain('User B');
  });

  it('identifies financial criteria blockade when own financial criteria is not approved', () => {
    const step = createBaseStep({
      financialCriteria: {
        requiredBudget: 5000,
        isApproved: false
      }
    });
    const process = createBaseProcess([step]);

    const result = analyzeStepBlockade(step, process);

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Aguardando liberação do orçamento');
    expect(result.missingCondition).toBe('Aprovação financeira explícita.');
  });

  it('identifies external criteria blockade when external action is pending', () => {
    const step = createBaseStep({
      externalCriteria: {
        partyName: 'Vendor X',
        actionRequired: 'Send invoice',
        isFulfilled: false
      }
    });
    const process = createBaseProcess([step]);

    const result = analyzeStepBlockade(step, process);

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Dependência externa pendente: Vendor X');
    expect(result.missingCondition).toBe('Send invoice');
  });

  it('identifies human approval blockade when required approvals are not met', () => {
    const step = createBaseStep({
      approval: {
        type: 'two_responsible',
        approvedBy: ['User A'],
        requiredApprovers: ['User A', 'User B'],
        totalRequired: 2
      }
    });
    const process = createBaseProcess([step]);

    const result = analyzeStepBlockade(step, process);

    expect(result.isBlocked).toBe(true);
    expect(result.reason).toContain('Aprovação humana necessária');
    expect(result.missingCondition).toContain('Assinatura/Aprovação dos responsáveis restantes');
  });
});
