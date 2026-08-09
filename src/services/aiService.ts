/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * Serviço de IA — Templates de processos e geração via linguagem natural
 */
import { Process, Step } from '../engine/types';
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

  'abertura_empresa': {
    name: 'Abertura e Estruturação de Nova Empresa / Filial',
    category: 'Jurídico & Financeiro',
    description: 'Processo integrado de consulta de viabilidade, elaboração de contrato social, alvará, abertura de conta bancária e BPO financeiro.',
    steps: [
      {
        id: 'step-101',
        title: 'Consulta Prévia de Viabilidade do Nome e Endereço',
        description: 'Verificação na Junta Comercial e Prefeitura da possibilidade de instalação.',
        layer: 1,
        status: 'in_progress',
        responsible: ['Contabilidade / Parceiro Vurio'],
        dependencies: []
      },
      {
        id: 'step-102',
        title: 'Elaboração e Assinatura do Contrato Social',
        description: 'Redação das cláusulas societárias e coleta de assinaturas dos sócios.',
        layer: 2,
        status: 'blocked',
        responsible: ['Sócios', 'Jurídico'],
        dependencies: [
          { dependsOnStepId: 'step-101', type: 'sequential' }
        ],
        approval: {
          type: 'two_responsible',
          approvedBy: [],
          requiredApprovers: ['Sócio 1', 'Sócio 2'],
          totalRequired: 2
        }
      },
      {
        id: 'step-103',
        title: 'Emissão do CNPJ e Inscrição Estadual',
        description: 'Protocolo na Receita Federal para obtenção do número de cadastro.',
        layer: 3,
        status: 'blocked',
        responsible: ['Contabilidade'],
        dependencies: [
          { dependsOnStepId: 'step-102', type: 'sequential' }
        ]
      },
      {
        id: 'step-104',
        title: 'Abertura de Conta PJ e Integração com BPO AnalisAí',
        description: 'Abertura da conta bancária institucional e conexão com os serviços de BPO financeiro da AnalisAí.',
        layer: 4,
        status: 'blocked',
        responsible: ['Equipe AnalisAí / Financeiro'],
        dependencies: [
          { dependsOnStepId: 'step-103', type: 'sequential' }
        ],
        externalCriteria: {
          partyName: 'Banco Institucional',
          actionRequired: 'Aprovação de compliance do cadastro bancário PJ',
          isFulfilled: false
        }
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
        ],
        financialCriteria: {
          requiredBudget: 0,
          approvedBudget: 0,
          currency: 'BRL',
          isApproved: false
        }
      }
    ]
  },

  'processo_compras': {
    name: 'Processo de Compras e Aquisições',
    category: 'Compras / Suprimentos',
    description: 'Fluxo estruturado de aquisição desde a requisição interna, cotação, aprovação orçamentária até o recebimento e conferência.',
    steps: [
      {
        id: 'step-301',
        title: 'Requisição Interna de Compra',
        description: 'Solicitação formal da área demandante com especificação técnica e justificativa de necessidade.',
        layer: 1,
        status: 'in_progress',
        responsible: ['Área Solicitante'],
        dependencies: [],
        approval: {
          type: 'individual',
          approvedBy: [],
          requiredApprovers: ['Gestor da Área'],
          totalRequired: 1
        }
      },
      {
        id: 'step-302',
        title: 'Cotação com Fornecedores (mínimo 3)',
        description: 'Pesquisa de mercado e coleta de no mínimo 3 propostas de fornecedores diferentes para comparação.',
        layer: 2,
        status: 'blocked',
        responsible: ['Equipe de Compras'],
        dependencies: [
          { dependsOnStepId: 'step-301', type: 'sequential' }
        ],
        externalCriteria: {
          partyName: 'Fornecedores',
          actionRequired: 'Envio das propostas comerciais com preço, prazo e condições',
          isFulfilled: false
        }
      },
      {
        id: 'step-303',
        title: 'Aprovação Orçamentária e Seleção do Fornecedor',
        description: 'Análise comparativa e aprovação do orçamento pela diretoria financeira.',
        layer: 3,
        status: 'blocked',
        responsible: ['Diretoria Financeira', 'Compras'],
        dependencies: [
          { dependsOnStepId: 'step-302', type: 'sequential' }
        ],
        financialCriteria: {
          requiredBudget: 15000,
          approvedBudget: 0,
          currency: 'BRL',
          isApproved: false
        },
        approval: {
          type: 'two_responsible',
          approvedBy: [],
          requiredApprovers: ['Financeiro', 'Gestor de Compras'],
          totalRequired: 2
        }
      },
      {
        id: 'step-304',
        title: 'Emissão do Pedido de Compra e Pagamento',
        description: 'Formalização do pedido ao fornecedor selecionado e processamento do pagamento conforme condições negociadas.',
        layer: 4,
        status: 'blocked',
        responsible: ['Compras', 'Financeiro'],
        dependencies: [
          { dependsOnStepId: 'step-303', type: 'sequential' }
        ]
      },
      {
        id: 'step-305',
        title: 'Recebimento, Conferência e Registro',
        description: 'Verificação física da entrega contra o pedido, conferência de qualidade e registro no sistema de estoque/patrimônio.',
        layer: 5,
        status: 'blocked',
        responsible: ['Almoxarifado / Área Solicitante'],
        dependencies: [
          { dependsOnStepId: 'step-304', type: 'sequential' }
        ],
        externalCriteria: {
          partyName: 'Fornecedor Selecionado',
          actionRequired: 'Entrega dos produtos/serviços conforme pedido de compra',
          isFulfilled: false
        }
      }
    ]
  },

  'implantacao_cliente': {
    name: 'Implantação de Novo Cliente',
    category: 'Operações / Customer Success',
    description: 'Processo completo de onboarding de novo cliente B2B, desde o kickoff até a operação estável e acompanhamento contínuo.',
    steps: [
      {
        id: 'step-401',
        title: 'Kickoff e Alinhamento de Expectativas',
        description: 'Reunião inaugural com o cliente para alinhar escopo, cronograma, responsáveis e critérios de sucesso.',
        layer: 1,
        status: 'in_progress',
        responsible: ['Customer Success', 'Gerente de Projeto'],
        dependencies: []
      },
      {
        id: 'step-402',
        title: 'Coleta de Dados e Documentação do Cliente',
        description: 'Recebimento de dados cadastrais, acessos, bases de dados e documentos necessários para a configuração.',
        layer: 2,
        status: 'blocked',
        responsible: ['Customer Success'],
        dependencies: [
          { dependsOnStepId: 'step-401', type: 'sequential' }
        ],
        externalCriteria: {
          partyName: 'Novo Cliente',
          actionRequired: 'Envio de planilhas, acessos a sistemas e documentos internos para migração',
          isFulfilled: false
        }
      },
      {
        id: 'step-403',
        title: 'Configuração do Ambiente e Parametrização',
        description: 'Setup técnico do ambiente do cliente: criação de tenant, parametrizações, integrações e importação de dados.',
        layer: 3,
        status: 'blocked',
        responsible: ['Equipe Técnica', 'DevOps'],
        dependencies: [
          { dependsOnStepId: 'step-402', type: 'sequential' }
        ]
      },
      {
        id: 'step-404',
        title: 'Treinamento da Equipe do Cliente',
        description: 'Capacitação dos usuários-chave do cliente sobre a plataforma, processos e boas práticas.',
        layer: 3,
        status: 'blocked',
        responsible: ['Customer Success', 'Trainer'],
        dependencies: [
          { dependsOnStepId: 'step-402', type: 'parallel' }
        ]
      },
      {
        id: 'step-405',
        title: 'Go-Live e Acompanhamento Intensivo',
        description: 'Início da operação real com suporte dedicado durante os primeiros 15 dias para garantir estabilidade.',
        layer: 4,
        status: 'blocked',
        responsible: ['Customer Success', 'Suporte Técnico'],
        dependencies: [
          { dependsOnStepId: 'step-403', type: 'convergent' },
          { dependsOnStepId: 'step-404', type: 'convergent' }
        ]
      },
      {
        id: 'step-406',
        title: 'Validação de Sucesso e Passagem para Ongoing',
        description: 'Avaliação dos KPIs de implantação, pesquisa de satisfação (NPS) e transição para acompanhamento contínuo.',
        layer: 5,
        status: 'blocked',
        responsible: ['Customer Success Manager'],
        dependencies: [
          { dependsOnStepId: 'step-405', type: 'sequential' }
        ],
        approval: {
          type: 'two_responsible',
          approvedBy: [],
          requiredApprovers: ['CS Manager', 'Cliente'],
          totalRequired: 2
        }
      }
    ]
  }
};

/**
 * Converte linguagem natural ou intenção do usuário em um processo estruturado do Vurio com IA.
 */
export async function generateProcessFromPrompt(prompt: string): Promise<Process> {
  const cleanPrompt = prompt.toLowerCase().trim();

  let baseTemplate: Partial<Process>;

  if (cleanPrompt.includes('contratar') || cleanPrompt.includes('funcionário') || cleanPrompt.includes('rh') || cleanPrompt.includes('colaborador')) {
    baseTemplate = PRESET_PROCESS_TEMPLATES['contratar_funcionario'];
  } else if (cleanPrompt.includes('abrir') || cleanPrompt.includes('empresa') || cleanPrompt.includes('filial') || cleanPrompt.includes('loja')) {
    baseTemplate = PRESET_PROCESS_TEMPLATES['abertura_empresa'];
  } else if (cleanPrompt.includes('venda') || cleanPrompt.includes('vendas') || cleanPrompt.includes('comercial') || cleanPrompt.includes('proposta') || cleanPrompt.includes('pipeline')) {
    baseTemplate = PRESET_PROCESS_TEMPLATES['processo_vendas'];
  } else if (cleanPrompt.includes('compra') || cleanPrompt.includes('compras') || cleanPrompt.includes('aquisição') || cleanPrompt.includes('fornecedor') || cleanPrompt.includes('cotação')) {
    baseTemplate = PRESET_PROCESS_TEMPLATES['processo_compras'];
  } else if (cleanPrompt.includes('implanta') || cleanPrompt.includes('cliente') || cleanPrompt.includes('onboarding') || cleanPrompt.includes('b2b') || cleanPrompt.includes('customer success')) {
    baseTemplate = PRESET_PROCESS_TEMPLATES['implantacao_cliente'];
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
    tags: ['IA Assisted', 'Vurio Core']
  };

  // Aplica o motor de dependências para resolver e atualizar bloqueios
  return resolveProcessState(rawProcess);
}