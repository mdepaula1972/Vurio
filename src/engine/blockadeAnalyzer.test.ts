import { describe, it, expect } from 'vitest';
import { analyzeStepBlockade } from './blockadeAnalyzer';
import { Process, Step } from './types';

describe('analyzeStepBlockade', () => {
  const createDummyProcess = (steps: Step[]): Process => ({
    id: 'proc-1',
    name: 'Processo Teste',
    category: 'Geral',
    description: 'Descrição do processo',
    isActive: true,
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: ['Alice', 'Bob'],
    tags: ['teste'],
  });

  const baseStep: Step = {
    id: 'step-1',
    title: 'Etapa 1',
    description: 'Descrição da etapa 1',
    layer: 1,
    status: 'in_progress',
    responsible: ['Alice'],
    dependencies: [],
  };

  it('returns no blockade when the step is completed', () => {
    const step: Step = { ...baseStep, status: 'completed' };
    const process = createDummyProcess([step]);

    const result = analyzeStepBlockade(step, process);

    expect(result).toEqual({
      isBlocked: false,
      reason: 'Etapa concluída com sucesso.',
      missingCondition: 'Nenhuma',
      responsibleParties: [],
      processImpact: 'Nenhum impacto negativo. Etapa finalizada.',
      aiRecommendation: 'Prosseguir para as etapas subsequentes que foram liberadas.',
    });
  });

  describe('Dependencies check', () => {
    it('handles unknown dependency step IDs gracefully', () => {
      const step: Step = {
        ...baseStep,
        dependencies: [
          { dependsOnStepId: 'non-existent-step', type: 'sequential' },
        ],
      };
      const process = createDummyProcess([step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(false);
      expect(result.reason).toBe('Nenhum bloqueio. Etapa pronta para ser executada.');
    });

    it('blocks on sequential dependency when parent step is not completed', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Aprovação Prévia',
        status: 'in_progress',
        responsible: ['Bob'],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'sequential' }],
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Pré-requisito sequencial pendente: "Aprovação Prévia" não foi concluída.');
      expect(result.missingCondition).toContain('Conclusão da etapa "Aprovação Prévia" (Status atual: in_progress)');
      expect(result.processImpact).toContain('O fluxo principal do processo está retido');
      expect(result.aiRecommendation).toContain('Solicite a Bob para finalizar "Aprovação Prévia"');
      expect(result.responsibleParties).toContain('Alice');
      expect(result.responsibleParties).toContain('Bob');
    });

    it('blocks on convergent dependency when parent step is pending', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Análise Paralela',
        status: 'not_started',
        responsible: ['Carol'],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'convergent' }],
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Etapa convergente aguardando múltiplas frentes');
      expect(result.missingCondition).toContain('Conclusão e fusão de dados das etapas convergentes prévias.');
      expect(result.processImpact).toContain('Decisões consolidadas não podem ser tomadas');
      expect(result.aiRecommendation).toContain('Verifique os gargalos em "Análise Paralela"');
    });

    it('blocks on conditional dependency with explicit condition expression', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Validação de Risco',
        status: 'in_progress',
        responsible: [],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [
          {
            dependsOnStepId: 'parent-1',
            type: 'conditional',
            conditionExpression: 'Risco < Alto',
          },
        ],
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Condição de desvio não atendida: "Risco < Alto"');
      expect(result.missingCondition).toBe('Risco < Alto');
      expect(result.processImpact).toContain('Impossível definir a rota de execução');
      expect(result.aiRecommendation).toContain('Avalie a condição necessária ou registre uma aprovação de exceção.');
    });

    it('blocks on conditional dependency with fallback condition rule', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Validação de Risco',
        status: 'in_progress',
        responsible: [],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'conditional' }],
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Condição de desvio não atendida: "Regra de negócio"');
      expect(result.missingCondition).toBe('Resultado esperado na etapa "Validação de Risco"');
    });

    it('blocks on financial dependency with parent step and custom budget criteria', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Alocação de Verba',
        status: 'in_progress',
        responsible: ['Financeiro'],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'financial' }],
        financialCriteria: {
          requiredBudget: 5000,
          isApproved: false,
        },
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Bloqueio financeiro: A etapa depende da validação de orçamento/caixa');
      expect(result.missingCondition).toContain('Liberação de orçamento de R$ 5.000');
      expect(result.processImpact).toContain('Risco de execução sem cobertura orçamentária');
      expect(result.aiRecommendation).toContain('Encaminhe o pedido de aprovação financeira');
    });

    it('blocks on financial dependency with parent step and default missing condition', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Alocação de Verba',
        status: 'in_progress',
        responsible: [],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'financial' }],
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.missingCondition).toBe('Aprovação de recurso financeiro.');
    });

    it('blocks on external dependency with parent step and custom external criteria', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Envio de Proposta',
        status: 'in_progress',
        responsible: [],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'external' }],
        externalCriteria: {
          partyName: 'Fornecedor X',
          actionRequired: 'Assinatura do contrato',
          isFulfilled: false,
        },
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Aguardando ação externa do cliente/fornecedor: Fornecedor X.');
      expect(result.missingCondition).toBe('Assinatura do contrato');
      expect(result.processImpact).toContain('Dependência de prazo externo');
      expect(result.aiRecommendation).toContain('Enviar lembrete ativo por e-mail ou WhatsApp para Fornecedor X.');
    });

    it('blocks on external dependency with default party name and action', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Envio de Proposta',
        status: 'in_progress',
        responsible: [],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'external' }],
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Aguardando ação externa do cliente/fornecedor: terceiros.');
      expect(result.missingCondition).toBe('Retorno ou envio de documento por terceiros.');
    });

    it('blocks on default / unsupported dependency type when parent is not completed', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Etapa Paralela',
        status: 'in_progress',
        responsible: [],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'parallel' as any }],
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe('Aguardando a conclusão da etapa dependente "Etapa Paralela".');
      expect(result.missingCondition).toBe('Conclusão de "Etapa Paralela".');
      expect(result.processImpact).toBe('Retenção de fluxo.');
      expect(result.aiRecommendation).toBe('Acompanhar o avanço com os responsáveis.');
    });

    it('ignores completed dependencies and moves forward', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Etapa Concluída',
        status: 'completed',
        responsible: [],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'sequential' }],
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(false);
    });
  });

  describe('Own step criteria check (when no dependency blockade exists)', () => {
    it('blocks when own financial criteria is not approved', () => {
      const step: Step = {
        ...baseStep,
        financialCriteria: {
          requiredBudget: 15000,
          isApproved: false,
        },
      };
      const process = createDummyProcess([step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Aguardando liberação do orçamento de R$ 15.000.');
      expect(result.missingCondition).toBe('Aprovação financeira explícita.');
      expect(result.processImpact).toContain('Impossibilidade de contratação ou compra');
      expect(result.aiRecommendation).toContain('Submeter justificativa de custo');
    });

    it('handles financial criteria with 0 requiredBudget if undefined', () => {
      const step: Step = {
        ...baseStep,
        financialCriteria: {
          isApproved: false,
        },
      };
      const process = createDummyProcess([step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Aguardando liberação do orçamento de R$ 0.');
    });

    it('blocks when own external criteria is not fulfilled', () => {
      const step: Step = {
        ...baseStep,
        externalCriteria: {
          partyName: 'Banco Central',
          actionRequired: 'Emissão de certidão',
          isFulfilled: false,
        },
      };
      const process = createDummyProcess([step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toBe('Dependência externa pendente: Banco Central');
      expect(result.missingCondition).toBe('Emissão de certidão');
      expect(result.processImpact).toBe('Prazo congelado aguardando envio do terceiro.');
      expect(result.aiRecommendation).toBe('Notificar a parte externa para cumprimento de envio.');
    });

    it('blocks when human approval is required and approvals are insufficient', () => {
      const step: Step = {
        ...baseStep,
        approval: {
          type: 'two_responsible',
          approvedBy: ['Gerente 1'],
          requiredApprovers: ['Gerente 1', 'Gerente 2'],
          totalRequired: 2,
        },
      };
      const process = createDummyProcess([step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.reason).toContain('Aprovação humana necessária (two_responsible): 1 de 2 aprovações registradas.');
      expect(result.missingCondition).toContain('Assinatura/Aprovação dos responsáveis restantes (Gerente 2).');
      expect(result.processImpact).toContain('Trava de governança');
      expect(result.aiRecommendation).toContain('Notificar pendência de aprovação no painel dos gestores.');
    });

    it('handles empty requiredApprovers list in human approval missingCondition fallback', () => {
      const step: Step = {
        ...baseStep,
        approval: {
          type: 'individual',
          approvedBy: [],
          requiredApprovers: [],
          totalRequired: 1,
        },
      };
      const process = createDummyProcess([step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.missingCondition).toContain('Assinatura/Aprovação dos responsáveis restantes (Responsáveis).');
    });
  });

  describe('Unblocked step check', () => {
    it('returns unblocked status when all criteria and dependencies are met', () => {
      const parentStep: Step = {
        ...baseStep,
        id: 'parent-1',
        title: 'Etapa Anterior',
        status: 'completed',
        responsible: ['Bob'],
      };
      const step: Step = {
        ...baseStep,
        id: 'step-2',
        dependencies: [{ dependsOnStepId: 'parent-1', type: 'sequential' }],
        financialCriteria: {
          requiredBudget: 1000,
          isApproved: true,
        },
        externalCriteria: {
          partyName: 'Fornecedor Y',
          actionRequired: 'Entrega do produto',
          isFulfilled: true,
        },
        approval: {
          type: 'individual',
          approvedBy: ['Diretor'],
          requiredApprovers: ['Diretor'],
          totalRequired: 1,
        },
      };
      const process = createDummyProcess([parentStep, step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(false);
      expect(result.reason).toBe('Nenhum bloqueio. Etapa pronta para ser executada.');
      expect(result.missingCondition).toBe('Condições satisfeitas.');
      expect(result.processImpact).toBe('Pronto para avanço.');
      expect(result.aiRecommendation).toBe('Executar etapa e marcar como concluída.');
    });

    it('uses existing blockedSince date if step was previously blocked', () => {
      const step: Step = {
        ...baseStep,
        financialCriteria: {
          requiredBudget: 500,
          isApproved: false,
        },
        blockadeInfo: {
          isBlocked: true,
          reason: 'Bloqueado anteriormente',
          missingCondition: 'Aprovação',
          responsibleParties: ['Alice'],
          blockedSince: '10/01/2026',
          processImpact: 'Alto',
          aiRecommendation: 'Aprovar',
        },
      };
      const process = createDummyProcess([step]);

      const result = analyzeStepBlockade(step, process);

      expect(result.isBlocked).toBe(true);
      expect(result.blockedSince).toBe('10/01/2026');
    });
  });
});
