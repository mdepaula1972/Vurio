/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * Analisador Explicável de Bloqueios e Impedimentos
 */
import { Step, Process, BlockadeInfo, StepDependency } from './types';

interface BlockadeDetails {
  primaryReason: string;
  missingCondition: string;
  processImpact: string;
  aiRecommendation: string;
}

/**
 * Retorna as informações de bloqueio para etapas já concluídas.
 */
function getCompletedStepBlockadeInfo(): BlockadeInfo {
  return {
    isBlocked: false,
    reason: 'Etapa concluída com sucesso.',
    missingCondition: 'Nenhuma',
    responsibleParties: [],
    processImpact: 'Nenhum impacto negativo. Etapa finalizada.',
    aiRecommendation: 'Prosseguir para as etapas subsequentes que foram liberadas.'
  };
}

/**
 * Formata detalhes explicativos de bloqueio com base no tipo de dependência entre etapas.
 */
function getDependencyReasonDetails(
  dep: StepDependency,
  parentStep: Step,
  step: Step
): BlockadeDetails {
  switch (dep.type) {
    case 'sequential':
      return {
        primaryReason: `Pré-requisito sequencial pendente: "${parentStep.title}" não foi concluída.`,
        missingCondition: `Conclusão da etapa "${parentStep.title}" (Status atual: ${parentStep.status})`,
        processImpact: 'O fluxo principal do processo está retido nesta etapa até a liberação do pré-requisito.',
        aiRecommendation: `Solicite a ${parentStep.responsible.join(', ') || 'responsável'} para finalizar "${parentStep.title}".`
      };

    case 'convergent':
      return {
        primaryReason: `Etapa convergente aguardando múltiplas frentes. "${parentStep.title}" ainda está pendente.`,
        missingCondition: 'Conclusão e fusão de dados das etapas convergentes prévias.',
        processImpact: 'Decisões consolidadas não podem ser tomadas sem a convergência dos dados.',
        aiRecommendation: `Verifique os gargalos em "${parentStep.title}" para unificar a entrega.`
      };

    case 'conditional':
      return {
        primaryReason: `Condição de desvio não atendida: "${dep.conditionExpression || 'Regra de negócio'}"`,
        missingCondition: dep.conditionExpression || `Resultado esperado na etapa "${parentStep.title}"`,
        processImpact: 'Impossível definir a rota de execução do processo.',
        aiRecommendation: 'Avalie a condição necessária ou registre uma aprovação de exceção.'
      };

    case 'financial':
      return {
        primaryReason: `Bloqueio financeiro: A etapa depende da validação de orçamento/caixa de "${parentStep.title}".`,
        missingCondition: step.financialCriteria?.requiredBudget
          ? `Liberação de orçamento de R$ ${step.financialCriteria.requiredBudget.toLocaleString('pt-BR')}`
          : 'Aprovação de recurso financeiro.',
        processImpact: 'Risco de execução sem cobertura orçamentária ou violação de caixa.',
        aiRecommendation: 'Encaminhe o pedido de aprovação financeira para a diretoria/BPO responsável.'
      };

    case 'external': {
      const party = step.externalCriteria?.partyName || 'terceiros';
      return {
        primaryReason: `Aguardando ação externa do cliente/fornecedor: ${party}.`,
        missingCondition: step.externalCriteria?.actionRequired || `Retorno ou envio de documento por ${party}.`,
        processImpact: 'Dependência de prazo externo pode comprometer o cronograma global.',
        aiRecommendation: `Enviar lembrete ativo por e-mail ou WhatsApp para ${party}.`
      };
    }

    default:
      return {
        primaryReason: `Aguardando a conclusão da etapa dependente "${parentStep.title}".`,
        missingCondition: `Conclusão de "${parentStep.title}".`,
        processImpact: 'Retenção de fluxo.',
        aiRecommendation: 'Acompanhar o avanço com os responsáveis.'
      };
  }
}

/**
 * Verifica se a etapa está bloqueada por dependências diretas de outras etapas.
 */
function checkDependencyBlockade(
  step: Step,
  stepMap: Map<string, Step>,
  responsibleParties: Set<string>
): BlockadeDetails | null {
  for (const dep of step.dependencies) {
    const parentStep = stepMap.get(dep.dependsOnStepId);

    if (!parentStep) {
      continue;
    }

    if (parentStep.status !== 'completed') {
      parentStep.responsible.forEach(r => responsibleParties.add(r));
      return getDependencyReasonDetails(dep, parentStep, step);
    }
  }

  return null;
}

/**
 * Verifica se a etapa está bloqueada por critérios financeiros próprios.
 */
function checkFinancialBlockade(step: Step): BlockadeDetails | null {
  if (step.financialCriteria && !step.financialCriteria.isApproved) {
    const budgetAmount = (step.financialCriteria.requiredBudget || 0).toLocaleString('pt-BR');
    return {
      primaryReason: `Aguardando liberação do orçamento de R$ ${budgetAmount}.`,
      missingCondition: 'Aprovação financeira explícita.',
      processImpact: 'Impossibilidade de contratação ou compra sem autorização financeira.',
      aiRecommendation: 'Submeter justificativa de custo para o centro de custo responsável.'
    };
  }
  return null;
}

/**
 * Verifica se a etapa está bloqueada por dependências externas próprias.
 */
function checkExternalBlockade(step: Step): BlockadeDetails | null {
  if (step.externalCriteria && !step.externalCriteria.isFulfilled) {
    return {
      primaryReason: `Dependência externa pendente: ${step.externalCriteria.partyName}`,
      missingCondition: step.externalCriteria.actionRequired,
      processImpact: 'Prazo congelado aguardando envio do terceiro.',
      aiRecommendation: 'Notificar a parte externa para cumprimento de envio.'
    };
  }
  return null;
}

/**
 * Verifica se a etapa está bloqueada por aprovações humanas pendentes (Human in the Loop).
 */
function checkApprovalBlockade(step: Step): BlockadeDetails | null {
  if (!step.approval) {
    return null;
  }

  const { type, approvedBy, totalRequired, requiredApprovers } = step.approval;

  if (approvedBy.length < totalRequired) {
    const pendingApprovers = requiredApprovers.filter(a => !approvedBy.includes(a));
    const missingApproversStr = pendingApprovers.length > 0 ? pendingApprovers.join(', ') : 'Responsáveis';

    return {
      primaryReason: `Aprovação humana necessária (${type}): ${approvedBy.length} de ${totalRequired} aprovações registradas.`,
      missingCondition: `Assinatura/Aprovação dos responsáveis restantes (${missingApproversStr}).`,
      processImpact: 'Trava de governança para prevenir avanço sem autorização formal.',
      aiRecommendation: 'Notificar pendência de aprovação no painel dos gestores.'
    };
  }

  return null;
}

/**
 * Analisa uma etapa dentro do processo e determina o estado de bloqueio detalhado e explicável.
 */
export function analyzeStepBlockade(step: Step, process: Process): BlockadeInfo {
  if (step.status === 'completed') {
    return getCompletedStepBlockadeInfo();
  }

  const stepMap = new Map<string, Step>(process.steps.map(s => [s.id, s]));
  const responsibleParties = new Set<string>(step.responsible);

  const blockadeDetails =
    checkDependencyBlockade(step, stepMap, responsibleParties) ||
    checkFinancialBlockade(step) ||
    checkExternalBlockade(step) ||
    checkApprovalBlockade(step);

  if (blockadeDetails) {
    return {
      isBlocked: true,
      reason: blockadeDetails.primaryReason,
      missingCondition: blockadeDetails.missingCondition,
      responsibleParties: Array.from(responsibleParties),
      blockedSince: step.blockadeInfo?.blockedSince || new Date().toLocaleDateString('pt-BR'),
      processImpact: blockadeDetails.processImpact,
      aiRecommendation: blockadeDetails.aiRecommendation
    };
  }

  return {
    isBlocked: false,
    reason: 'Nenhum bloqueio. Etapa pronta para ser executada.',
    missingCondition: 'Condições satisfeitas.',
    responsibleParties: Array.from(responsibleParties),
    blockedSince: undefined,
    processImpact: 'Pronto para avanço.',
    aiRecommendation: 'Executar etapa e marcar como concluída.'
  };
}
