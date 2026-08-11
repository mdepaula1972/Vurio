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

export type ProcessViewMode = 'graph' | 'kanban' | 'pulse_flow' | 'timeline' | 'list';

export type MetricType = 'deadline' | 'budget' | 'hybrid';

export interface PulseStage {
  id: string;
  name: string;
  weight: number; // Ex: 25 (%)
  wipLimit?: number | null; // Limite máximo de itens na coluna (Start / Backlog)
  color?: string;
  description?: string;
}

export interface AIAuditInfo {
  required: boolean;
  allowedTypes: string[]; // ex: ['pdf', 'png', 'jpg', 'xml', 'nfe']
  status: 'none' | 'pending' | 'auditing' | 'approved' | 'rejected';
  fileName?: string;
  fileUrl?: string;
  feedback?: string;
  auditedAt?: string;
}

export interface ExceptionRule {
  hasRequested: boolean;
  requiredRole: 'gerencia' | 'diretoria';
  status: 'none' | 'pending' | 'approved' | 'rejected';
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  extendedHours?: number;
}

export interface BudgetData {
  targetAmount: number;
  spentAmount: number;
  currency: string;
}

export interface DeadlineData {
  totalHours: number;
  remainingHours: number;
  deadlineDate?: string;
}

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
  stageId?: string; // ID do estágio do Pulse Flow
  stageWeight?: number; // Peso percentual (ex: 20%)
  layer: number; // Camada hierárquica (1..N)
  status: StepStatus;
  responsible: string[];
  dependencies: StepDependency[];
  approval?: ApprovalRequirement;
  metricType?: MetricType;
  budgetData?: BudgetData;
  deadlineData?: DeadlineData;
  aiAudit?: AIAuditInfo;
  exceptionRule?: ExceptionRule;
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
  weightedProgress?: number;
}

export interface Process {
  id: string;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  steps: Step[];
  stages?: PulseStage[];
  createdAt: string;
  updatedAt: string;
  participants: string[];
  tags: string[];
  companyOptions?: CompanyOptions;
  metrics?: ProcessMetrics;
}
