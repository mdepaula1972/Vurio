/**
 * Vurio v1.3.0 — Gestor Inteligente de Processos com IA
 * Definições de tipos e interfaces do motor Vurio
 */
export type DependencyType = 
  | 'sequential'   // A -> B
  | 'parallel'     // A -> B e A -> C
  | 'convergent'   // B + C -> D
  | 'conditional'  // Se X, seguir A; se Y, seguir B
  | 'hierarchical' // Processo -> Fases -> Subetapas
  | 'external'     // Dependência de cliente, fornecedor ou terceiro
  | 'financial';   // Avanço condicionado a orçamento, caixa ou indicador

export type StepStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';

export type CompanyTaxRegime = 'mei' | 'simples' | 'presumido' | 'real';

export interface CompanyOptions {
  regime: CompanyTaxRegime;
  hasExistingCompany: boolean;
}

export type CreationMode = 'company' | 'process_ai' | 'process_document' | 'process_manual';

export interface DocumentUploadData {
  fileName: string;
  fileType: string;
  extractedText: string;
}

export type ProcessViewMode = 'graph' | 'kanban' | 'timeline' | 'list';

export type ApprovalType = 
  | 'individual' 
  | 'two_responsible' 
  | 'three_responsible' 
  | 'two_of_three' 
  | 'hierarchical';

export interface ApprovalRequirement {
  type: ApprovalType;
  approvedBy: string[];
  requiredApprovers: string[];
  totalRequired: number;
}

export interface BlockadeInfo {
  isBlocked: boolean;
  reason: string;
  missingCondition: string;
  responsibleParties: string[];
  blockedSince?: string;
  processImpact: string;
  aiRecommendation: string;
}

export interface StepDependency {
  dependsOnStepId: string;
  type: DependencyType;
  conditionExpression?: string;
  description?: string;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  phaseId?: string;
  phaseName?: string;
  layer: number; // Camada hierárquica (1..N)
  status: StepStatus;
  responsible: string[];
  dependencies: StepDependency[];
  approval?: ApprovalRequirement;
  financialCriteria?: {
    requiredBudget?: number;
    approvedBudget?: number;
    currency?: string;
    isApproved?: boolean;
  };
  externalCriteria?: {
    partyName: string;
    actionRequired: string;
    isFulfilled: boolean;
  };
  blockadeInfo?: BlockadeInfo;
  deadlineDays?: number;
  completedAt?: string;
}

export interface ProcessMetrics {
  healthScore: number; // 0..100%
  timeSavedHours: number;
  criticalPathCount: number;
}

export interface Process {
  id: string;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
  participants: string[];
  tags: string[];
  companyOptions?: CompanyOptions;
  metrics?: ProcessMetrics;
}
