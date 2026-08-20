/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * Analisador Explicável de Bloqueios e Impedimentos
 */
import { Step, Process, BlockadeInfo } from './types';


/**
 * Analisa uma etapa dentro do processo e determina o estado de bloqueio detalhado e explicável.
 */
export function analyzeStepBlockade(step: Step, process: Process): BlockadeInfo {
  // Se a etapa já estiver concluída, não há bloqueio
  if (step.status === 'completed') {
    return {
      isBlocked: false,
      reason: 'Etapa concluída com sucesso.',
      missingCondition: 'Nenhuma',
      responsibleParties: [],
      processImpact: 'Nenhum impacto negativo. Etapa finalizada.',
      aiRecommendation: 'Prosseguir para as etapas subsequentes que foram liberadas.'
    };
  }

  const stepMap = new Map<string, Step>(process.steps.map(s => [s.id, s]));
  const missingDependencies: string[] = [];
  const responsibleParties = new Set<string>(step.responsible);
  let primaryReason = '';
  let missingCondition = '';
  let processImpact = '';
  let aiRecommendation = '';

  // 1. Checagem de Dependências Diretas
  for (const dep of step.dependencies) {
    const parentStep = stepMap.get(dep.dependsOnStepId);
    
    if (!parentStep) {
      missingDependencies.push(`Dependência desconhecida (${dep.dependsOnStepId})`);
      continue;
    }

    if (parentStep.status !== 'completed') {
      parentStep.responsible.forEach(r => responsibleParties.add(r));
      
      switch (dep.type) {
        case 'sequential':
          primaryReason = `Pré-requisito sequencial pendente: "${parentStep.title}" não foi concluída.`;
          missingCondition = `Conclusão da etapa "${parentStep.title}" (Status atual: ${parentStep.status})`;
          processImpact = `O fluxo principal do processo está retido nesta etapa até a liberação do pré-requisito.`;
          aiRecommendation = `Solicite a ${parentStep.responsible.join(', ') || 'responsável'} para finalizar "${parentStep.title}".`;
          break;

        case 'convergent':
          primaryReason = `Etapa convergente aguardando múltiplas frentes. "${parentStep.title}" ainda está pendente.`;
          missingCondition = `Conclusão e fusão de dados das etapas convergentes prévias.`;
          processImpact = `Decisões consolidadas não podem ser tomadas sem a convergência dos dados.`;
          aiRecommendation = `Verifique os gargalos em "${parentStep.title}" para unificar a entrega.`;
          break;

        case 'conditional':
          primaryReason = `Condição de desvio não atendida: "${dep.conditionExpression || 'Regra de negócio'}"`;
          missingCondition = dep.conditionExpression || `Resultado esperado na etapa "${parentStep.title}"`;
          processImpact = `Impossível definir a rota de execução do processo.`;
          aiRecommendation = `Avalie a condição necessária ou registre uma aprovação de exceção.`;
          break;

        case 'financial':
          primaryReason = `Bloqueio financeiro: A etapa depende da validação de orçamento/caixa de "${parentStep.title}".`;
          missingCondition = step.financialCriteria?.requiredBudget 
            ? `Liberação de orçamento de R$ ${step.financialCriteria.requiredBudget.toLocaleString('pt-BR')}`
            : `Aprovação de recurso financeiro.`;
          processImpact = `Risco de execução sem cobertura orçamentária ou violação de caixa.`;
          aiRecommendation = `Encaminhe o pedido de aprovação financeira para a diretoria/BPO responsável.`;
          break;

        case 'external':
          const party = step.externalCriteria?.partyName || 'terceiros';
          primaryReason = `Aguardando ação externa do cliente/fornecedor: ${party}.`;
          missingCondition = step.externalCriteria?.actionRequired || `Retorno ou envio de documento por ${party}.`;
          processImpact = `Dependência de prazo externo pode comprometer o cronograma global.`;
          aiRecommendation = `Enviar lembrete ativo por e-mail ou WhatsApp para ${party}.`;
          break;

        default:
          primaryReason = `Aguardando a conclusão da etapa dependente "${parentStep.title}".`;
          missingCondition = `Conclusão de "${parentStep.title}".`;
          processImpact = `Retenção de fluxo.`;
          aiRecommendation = `Acompanhar o avanço com os responsáveis.`;
      }
      break; // Pega o principal bloqueio por prioridade
    }
  }

  // 2. Checagem de Critérios Financeiros Próprios
  if (!primaryReason && step.financialCriteria && !step.financialCriteria.isApproved) {
    primaryReason = `Aguardando liberação do orçamento de R$ ${(step.financialCriteria.requiredBudget || 0).toLocaleString('pt-BR')}.`;
    missingCondition = `Aprovação financeira explícita.`;
    processImpact = `Impossibilidade de contratação ou compra sem autorização financeira.`;
    aiRecommendation = `Submeter justificativa de custo para o centro de custo responsável.`;
  }

  // 3. Checagem de Externa Própria
  if (!primaryReason && step.externalCriteria && !step.externalCriteria.isFulfilled) {
    primaryReason = `Dependência externa pendente: ${step.externalCriteria.partyName}`;
    missingCondition = step.externalCriteria.actionRequired;
    processImpact = `Prazo congelado aguardando envio do terceiro.`;
    aiRecommendation = `Notificar a parte externa para cumprimento de envio.`;
  }

  // 4. Checagem de Aprovações Humanas (Human in the Loop)
  if (!primaryReason && step.approval) {
    const { type, approvedBy, totalRequired } = step.approval;
    if (approvedBy.length < totalRequired) {
      primaryReason = `Aprovação humana necessária (${type}): ${approvedBy.length} de ${totalRequired} aprovações registradas.`;
      missingCondition = `Assinatura/Aprovação dos responsáveis restantes (${step.approval.requiredApprovers.filter(a => !approvedBy.includes(a)).join(', ') || 'Responsáveis'}).`;
      processImpact = `Trava de governança para prevenir avanço sem autorização formal.`;
      aiRecommendation = `Notificar pendência de aprovação no painel dos gestores.`;
    }
  }

  const isBlocked = primaryReason.length > 0;

  return {
    isBlocked,
    reason: isBlocked ? primaryReason : 'Nenhum bloqueio. Etapa pronta para ser executada.',
    missingCondition: isBlocked ? missingCondition : 'Condições satisfeitas.',
    responsibleParties: Array.from(responsibleParties),
    blockedSince: isBlocked ? (step.blockadeInfo?.blockedSince || new Date().toLocaleDateString('pt-BR')) : undefined,
    processImpact: isBlocked ? processImpact : 'Pronto para avanço.',
    aiRecommendation: isBlocked ? aiRecommendation : 'Executar etapa e marcar como concluída.'
  };
}
