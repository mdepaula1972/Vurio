/**
 * Vurio v1.2.0 — Gestor Inteligente de Processos com IA
 * Serviço de IA — Templates de processos, suporte a MEI/Simples/Presumido/Real e Ingestão de Documentos (POPs/Manuais)
 */
import { Process, Step, CompanyOptions, DocumentUploadData } from '../engine/types';
import { resolveProcessState } from '../engine/dependencyResolver';

// Processos pré-estruturados modelo (Templates Prontos)
export const PRESET_PROCESS_TEMPLATES: Record<string, Partial<Process>> = {
  'contratar_funcionario': {
    name: 'Contratação e Onboarding de Funcionário',
    category: 'Recursos Humanos / Operação',
    description: 'Processo completo desde a aprovação da vaga, orçamento de RH, envio de documentos pelo candidato, até a infraestrutura e integração inicial.',
    steps: [
      {
        id: 'step-1',
        title: 'Aprovação de Orçamento da Vaga',
        description: 'Validação da disponibilidade financeira e da necessidade de contratação.',
        layer: 1,
        status: 'in_progress',
        responsible: ['Diretoria Financeira', 'Gestor da Área'],
        dependencies: [],
        financialCriteria: {
          requiredBudget: 8500,
          approvedBudget: 8500,
          currency: 'BRL',
          isApproved: true
        },
        approval: {
          type: 'two_responsible',
          approvedBy: ['Financeiro'],
          requiredApprovers: ['Financeiro', 'Gestor'],
          totalRequired: 2
        }
      },
      {
        id: 'step-2',
        title: 'Abertura e Divulgação da Vaga',
        description: 'Publicação nos canais de recrutamento e triagem de currículos.',
        layer: 2,
        status: 'blocked',
        responsible: ['Equipe de RH'],
        dependencies: [
          { dependsOnStepId: 'step-1', type: 'sequential' }
        ]
      },
      {
        id: 'step-3',
        title: 'Entrevistas e Escolha do Candidato',
        description: 'Realização de entrevistas técnicas e comportamentais com a liderança.',
        layer: 3,
        status: 'blocked',
        responsible: ['Gestor da Área', 'RH'],
        dependencies: [
          { dependsOnStepId: 'step-2', type: 'sequential' }
        ]
      },
      {
        id: 'step-4',
        title: 'Envio de Documentos pelo Candidato',
        description: 'Aguardando o envio de RG, CPF, Carteira de Trabalho e Comprovante de Residência pelo novo colaborador.',
        layer: 4,
        status: 'blocked',
        responsible: ['Candidato Selecionado'],
        dependencies: [
          { dependsOnStepId: 'step-3', type: 'sequential' }
        ],
        externalCriteria: {
          partyName: 'Novo Colaborador',
          actionRequired: 'Envio das fotos/PDFs dos documentos pessoais e exame admissional',
          isFulfilled: false
        }
      },
      {
        id: 'step-5',
        title: 'Compra de Equipamentos e Acessos de TI',
        description: 'Aquisição do notebook e criação das credenciais nos sistemas da empresa.',
        layer: 4,
        status: 'blocked',
        responsible: ['Equipe de TI / Compras'],
        dependencies: [
          { dependsOnStepId: 'step-3', type: 'parallel' },
          { dependsOnStepId: 'step-1', type: 'financial' }
        ],
        financialCriteria: {
          requiredBudget: 6000,
          approvedBudget: 0,
          currency: 'BRL',
          isApproved: false
        }
      },
      {
        id: 'step-6',
        title: 'Integração e Boas-Vindas no 1º Dia',
        description: 'Apresentação para a equipe, treinamento inicial e entrega dos equipamentos.',
        layer: 5,
        status: 'blocked',
        responsible: ['Gestor da Área', 'RH'],
        dependencies: [
          { dependsOnStepId: 'step-4', type: 'convergent' },
          { dependsOnStepId: 'step-5', type: 'convergent' }
        ]
      }
    ]
  },

  'processo_vendas': {
    name: 'Processo de Vendas B2B',
    category: 'Comercial / Vendas',
    description: 'Pipeline completo de vendas corporativas, desde a prospecção até o fechamento do contrato e handoff para operações.',
    steps: [
      {
        id: 'step-201',
        title: 'Prospecção e Qualificação do Lead',
        description: 'Identificação do perfil ideal de cliente (ICP), primeiro contato e qualificação da oportunidade comercial.',
        layer: 1,
        status: 'in_progress',
        responsible: ['SDR / Pré-vendas'],
        dependencies: []
      },
      {
        id: 'step-202',
        title: 'Reunião de Diagnóstico e Apresentação',
        description: 'Reunião consultiva para entender dores, necessidades e apresentar a solução de forma personalizada.',
        layer: 2,
        status: 'blocked',
        responsible: ['Executivo de Contas'],
        dependencies: [
          { dependsOnStepId: 'step-201', type: 'sequential' }
        ]
      },
      {
        id: 'step-203',
        title: 'Elaboração e Envio da Proposta Comercial',
        description: 'Construção da proposta com escopo, preço, condições e SLA. Requer aprovação do gestor comercial.',
        layer: 3,
        status: 'blocked',
        responsible: ['Executivo de Contas', 'Gestor Comercial'],
        dependencies: [
          { dependsOnStepId: 'step-202', type: 'sequential' }
        ],
        approval: {
          type: 'individual',
          approvedBy: [],
          requiredApprovers: ['Gestor Comercial'],
          totalRequired: 1
        }
      },
      {
        id: 'step-204',
        title: 'Negociação e Aprovação do Cliente',
        description: 'Rodadas de negociação com o cliente. Aguardando aceite formal ou ajustes na proposta.',
        layer: 4,
        status: 'blocked',
        responsible: ['Executivo de Contas'],
        dependencies: [
          { dependsOnStepId: 'step-203', type: 'sequential' }
        ],
        externalCriteria: {
          partyName: 'Cliente Prospectado',
          actionRequired: 'Aceite formal da proposta comercial e assinatura do contrato',
          isFulfilled: false
        }
      },
      {
        id: 'step-205',
        title: 'Faturamento e Handoff para Operações',
        description: 'Emissão da primeira nota fiscal e transferência do cliente para a equipe de implantação/operações.',
        layer: 5,
        status: 'blocked',
        responsible: ['Financeiro', 'Operações'],
        dependencies: [
          { dependsOnStepId: 'step-204', type: 'convergent' }
        ]
      }
    ]
  }
};

function buildMeiBlockadeProcess(): Partial<Process> {
  return {
    name: 'Abertura de Empresa (MEI — Impedimento Legal)',
    category: 'Jurídico & Fiscal',
    description: 'Estruturação travada por impedimento legal de sociedade prévia no MEI (LC nº 123/2006).',
    steps: [
      {
        id: 'step-mei-block',
        title: 'Impedimento Legal: Já possui empresa em seu nome',
        description: 'A Legislação Brasileira (LC 123/2006) veda expressamente que sócios de outras empresas sejam titulares de MEI.',
        layer: 1,
        status: 'blocked',
        responsible: ['Titular / Contabilidade'],
        dependencies: [],
        blockadeInfo: {
          isBlocked: true,
          reason: 'Titular já possui participação societária ou empresa individual ativa.',
          missingCondition: 'Alteração da opção de regime para Simples Nacional / Lucro Presumido ou baixa da empresa anterior.',
          responsibleParties: ['Titular da Empresa'],
          processImpact: 'Impossível emitir o CCMEI pela Receita Federal enquanto constar vínculo empresarial.',
          aiRecommendation: 'Recomendamos alterar o processo para Simples Nacional (ME) ou consultar seu contador no AnalisAí.'
        }
      },
      {
        id: 'step-mei-resolution',
        title: 'Ajuste de Enquadramento para Simples Nacional (ME)',
        description: 'Migração do planejamento para Microempresa (ME) enquadrada no Simples Nacional.',
        layer: 2,
        status: 'blocked',
        responsible: ['Contabilidade / Parceiro Vurio'],
        dependencies: [
          { dependsOnStepId: 'step-mei-block', type: 'sequential' }
        ]
      }
    ]
  };
}

function buildMeiSimplifiedProcess(): Partial<Process> {
  return {
    name: 'Abertura de Empresa (MEI — Registro Simplificado)',
    category: 'Jurídico & Fiscal',
    description: 'Processo simplificado de MEI. Consulta prévia de viabilidade de nome e endereço DISPENSADA por lei.',
    steps: [
      {
        id: 'step-mei-1',
        title: 'Emissão do CCMEI e Cadastro no Portal Gov.br',
        description: 'Dispensa de viabilidade prévia. Início direto na geração do Certificado da Condição de Microempreendedor Individual e CNPJ.',
        layer: 1,
        status: 'in_progress',
        responsible: ['Empreendedor / Parceiro Vurio'],
        dependencies: []
      },
      {
        id: 'step-mei-2',
        title: 'Inscrição Municipal e Emissão de Nota Fiscal',
        description: 'Solicitação do cadastro na prefeitura local para emissão de NF de serviços (NFS-e) no padrão nacional.',
        layer: 2,
        status: 'blocked',
        responsible: ['Empreendedor'],
        dependencies: [
          { dependsOnStepId: 'step-mei-1', type: 'sequential' }
        ]
      },
      {
        id: 'step-mei-3',
        title: 'Abertura de Conta Bancária PJ e BPO AnalisAí',
        description: 'Conexão com a conta jurídica e integração com a gestão financeira do AnalisAí.',
        layer: 3,
        status: 'blocked',
        responsible: ['Equipe AnalisAí / Financeiro'],
        dependencies: [
          { dependsOnStepId: 'step-mei-2', type: 'sequential' }
        ]
      }
    ]
  };
}

function buildCorporateOpeningProcess(regime: string): Partial<Process> {
  const regimeNames: Record<string, string> = {
    simples: 'Simples Nacional (ME / EPP)',
    presumido: 'Lucro Presumido',
    real: 'Lucro Real'
  };

  const regimeName = regimeNames[regime] || 'Simples Nacional';

  return {
    name: `Abertura de Empresa (${regimeName})`,
    category: 'Jurídico & Financeiro',
    description: `Processo completo com consulta de viabilidade prévia, contrato social, órgãos de registro e opção pelo ${regimeName}.`,
    steps: [
      {
        id: 'step-corp-1',
        title: 'Consulta Prévia de Viabilidade de Nome e Endereço',
        description: 'Pesquisa obrigatória na Junta Comercial e Prefeitura para validação de uso do nome empresarial e zoneamento urbano.',
        layer: 1,
        status: 'in_progress',
        responsible: ['Contabilidade / Parceiro Vurio'],
        dependencies: []
      },
      {
        id: 'step-corp-2',
        title: 'Elaboração e Assinatura do Contrato Social',
        description: 'Redação da minuta societária, definição de capital social e coleta de assinaturas digitais (GOV.BR / e-CPF).',
        layer: 2,
        status: 'blocked',
        responsible: ['Sócios', 'Jurídico'],
        dependencies: [
          { dependsOnStepId: 'step-corp-1', type: 'sequential' }
        ],
        approval: {
          type: 'two_responsible',
          approvedBy: [],
          requiredApprovers: ['Sócio 1', 'Sócio 2'],
          totalRequired: 2
        }
      },
      {
        id: 'step-corp-3',
        title: 'Emissão de CNPJ na Receita Federal e Inscrição Estadual',
        description: 'DSO/FCPJ aprovado com geração do número do CNPJ e inscrição tributária estadual.',
        layer: 3,
        status: 'blocked',
        responsible: ['Contabilidade'],
        dependencies: [
          { dependsOnStepId: 'step-corp-2', type: 'sequential' }
        ]
      },
      {
        id: 'step-corp-4',
        title: `Opção Formal pelo Regime: ${regimeName}`,
        description: `Enquadramento oficial no portal da Receita Federal para tributação pelo ${regimeName}.`,
        layer: 4,
        status: 'blocked',
        responsible: ['Contabilidade / BPO'],
        dependencies: [
          { dependsOnStepId: 'step-corp-3', type: 'sequential' }
        ]
      },
      {
        id: 'step-corp-5',
        title: 'Abertura de Conta PJ e Integração com BPO AnalisAí',
        description: 'Formalização bancária e vinculação com os serviços de inteligência financeira do AnalisAí.',
        layer: 5,
        status: 'blocked',
        responsible: ['Equipe AnalisAí / Financeiro'],
        dependencies: [
          { dependsOnStepId: 'step-corp-4', type: 'sequential' }
        ],
        externalCriteria: {
          partyName: 'Banco Institucional',
          actionRequired: 'Validação de compliance do contrato social e representantes legais',
          isFulfilled: false
        }
      }
    ]
  };
}

/**
 * Função geradora de processos de Abertura de Empresa com suporte a regras fiscais (MEI vs Simples/Presumido/Real)
 */
export function buildCompanyOpeningProcess(options?: CompanyOptions): Partial<Process> {
  const regime = options?.regime || 'simples';
  const hasExistingCompany = options?.hasExistingCompany || false;

  // CASO 1: MEI com conflito de sociedade existente
  if (regime === 'mei' && hasExistingCompany) {
    return buildMeiBlockadeProcess();
  }

  // CASO 2: MEI sem outra empresa (MEI Válido) -> DISPENSA CONSULTA PRÉVIA
  if (regime === 'mei' && !hasExistingCompany) {
    return buildMeiSimplifiedProcess();
  }

  // CASO 3: Simples Nacional, Lucro Presumido ou Lucro Real -> EXIGE CONSULTA PRÉVIA DE VIABILIDADE
  return buildCorporateOpeningProcess(regime);
}

/**
 * Converte um Documento (POP / Manual) em Etapas Distribuídas Inteligentes
 */
export function generateProcessFromDocument(docData: DocumentUploadData): Process {
  const lines = docData.extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const steps: Step[] = [];
  let currentLayer = 1;

  if (lines.length === 0) {
    lines.push("Planejamento Inicial do Documento");
    lines.push("Execução das Etapas Operacionais");
    lines.push("Validação e Encerramento");
  }

  // Divide as linhas em blocos de etapas
  const chunkSize = Math.max(1, Math.ceil(lines.length / 5));

  for (let i = 0; i < lines.length && steps.length < 7; i += chunkSize) {
    const chunkLines = lines.slice(i, i + chunkSize);
    const titleLine = chunkLines[0].replace(/^[\d\.\-\*\#\s]+/, '');
    const desc = chunkLines.slice(1).join(' ') || `Execução e acompanhamento detalhado da etapa conforme documentação em ${docData.fileName}.`;

    const stepId = `doc-step-${steps.length + 1}`;
    const prevStepId = steps.length > 0 ? steps[steps.length - 1].id : null;

    steps.push({
      id: stepId,
      title: titleLine.length > 60 ? titleLine.substring(0, 57) + '...' : titleLine,
      description: desc.length > 180 ? desc.substring(0, 177) + '...' : desc,
      layer: currentLayer,
      status: steps.length === 0 ? 'in_progress' : 'blocked',
      responsible: steps.length === 0 ? ['Liderança / Gestor'] : ['Equipe Operacional / Responsável'],
      dependencies: prevStepId ? [{ dependsOnStepId: prevStepId, type: 'sequential' }] : [],
    });

    currentLayer++;
  }

  const rawProcess: Process = {
    id: `proc-doc-${Date.now()}`,
    name: `Processo extraído de: ${docData.fileName}`,
    category: 'Processos Internos / POP',
    description: `Workflow gerado automaticamente pela IA a partir do documento '${docData.fileName}'.`,
    isActive: true,
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: ['Você (Gestor)', 'Equipe Operacional'],
    tags: ['Document IA', 'POP Ingestion']
  };

  return resolveProcessState(rawProcess);
}

/**
 * Converte linguagem natural ou intenção do usuário em um processo estruturado do Vurio com IA.
 */
export async function generateProcessFromPrompt(
  prompt: string,
  companyOptions?: CompanyOptions
): Promise<Process> {
  const cleanPrompt = prompt.toLowerCase().trim();

  let baseTemplate: Partial<Process>;

  if (cleanPrompt.includes('abrir') || cleanPrompt.includes('empresa') || cleanPrompt.includes('filial') || cleanPrompt.includes('loja') || cleanPrompt.includes('mei') || cleanPrompt.includes('simples')) {
    baseTemplate = buildCompanyOpeningProcess(companyOptions);
  } else if (cleanPrompt.includes('contratar') || cleanPrompt.includes('funcionário') || cleanPrompt.includes('rh') || cleanPrompt.includes('colaborador')) {
    baseTemplate = PRESET_PROCESS_TEMPLATES['contratar_funcionario'];
  } else if (cleanPrompt.includes('venda') || cleanPrompt.includes('vendas') || cleanPrompt.includes('comercial') || cleanPrompt.includes('proposta') || cleanPrompt.includes('pipeline')) {
    baseTemplate = PRESET_PROCESS_TEMPLATES['processo_vendas'];
  } else {
    // Gerador Dinâmico baseado na intenção digitada pelo usuário
    baseTemplate = {
      name: prompt.charAt(0).toUpperCase() + prompt.slice(1),
      category: 'Geral & Operações',
      description: `Processo gerado via Inteligência Artificial do Vurio para '${prompt}'.`,
      steps: [
        {
          id: 'gen-1',
          title: `Definição de Escopo e Planejamento: ${prompt}`,
          description: 'Alinhamento inicial das metas, responsáveis e critérios de aprovação.',
          layer: 1,
          status: 'in_progress',
          responsible: ['Gestor do Projeto'],
          dependencies: [],
          approval: {
            type: 'individual',
            approvedBy: [],
            requiredApprovers: ['Gestor'],
            totalRequired: 1
          }
        },
        {
          id: 'gen-2',
          title: 'Validação Orçamentária e Recursos',
          description: 'Verificação da disponibilidade financeira para a execução.',
          layer: 2,
          status: 'blocked',
          responsible: ['Financeiro'],
          dependencies: [
            { dependsOnStepId: 'gen-1', type: 'financial' }
          ],
          financialCriteria: {
            requiredBudget: 5000,
            approvedBudget: 0,
            currency: 'BRL',
            isApproved: false
          }
        },
        {
          id: 'gen-3',
          title: 'Execução e Coleta de Insumos Externos',
          description: 'Desenvolvimento das entregas principais com acompanhamento de terceiros.',
          layer: 3,
          status: 'blocked',
          responsible: ['Equipe Operacional'],
          dependencies: [
            { dependsOnStepId: 'gen-2', type: 'sequential' }
          ],
          externalCriteria: {
            partyName: 'Cliente / Fornecedor Externo',
            actionRequired: 'Envio de documentação ou aprovação final',
            isFulfilled: false
          }
        },
        {
          id: 'gen-4',
          title: 'Validação Final e Entrega de Resultados',
          description: 'Avaliação dos indicadores alcançados e encerramento do processo.',
          layer: 4,
          status: 'blocked',
          responsible: ['Liderança Executiva'],
          dependencies: [
            { dependsOnStepId: 'gen-3', type: 'convergent' }
          ]
        }
      ]
    };
  }

  const rawProcess: Process = {
    id: `proc-${Date.now()}`,
    name: baseTemplate.name || 'Novo Processo Inteligente',
    category: baseTemplate.category || 'Geral',
    description: baseTemplate.description || '',
    isActive: true,
    steps: baseTemplate.steps || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participants: ['Você (Gestor)', 'Diretoria Financeira', 'RH / Operação'],
    tags: ['IA Assisted', 'Vurio Core'],
    companyOptions
  };

  // Aplica o motor de dependências para resolver e atualizar bloqueios
  return resolveProcessState(rawProcess);
}