import { describe, it, expect } from 'vitest';
import { generateProcessFromPrompt, buildCompanyOpeningProcess, PRESET_PROCESS_TEMPLATES } from './aiService';

describe('aiService - generateProcessFromPrompt', () => {
  describe('Company opening intent ("abrir", "empresa", "filial", "loja", "mei", "simples")', () => {
    it('should generate company opening process for MEI with existing company (legal impediment)', async () => {
      const prompt = 'abrir empresa';
      const companyOptions = { regime: 'mei' as const, hasExistingCompany: true };

      const process = await generateProcessFromPrompt(prompt, companyOptions);

      expect(process.name).toContain('MEI — Impedimento Legal');
      expect(process.category).toBe('Jurídico & Fiscal');
      expect(process.companyOptions).toEqual(companyOptions);
      expect(process.steps).toHaveLength(2);
      expect(process.steps[0].id).toBe('step-mei-block');
      expect(process.steps[0].status).toBe('in_progress');
      expect(process.steps[1].id).toBe('step-mei-resolution');
      expect(process.steps[1].status).toBe('blocked');
    });

    it('should generate company opening process for MEI without existing company (simplified registration)', async () => {
      const prompt = 'quero abrir mei';
      const companyOptions = { regime: 'mei' as const, hasExistingCompany: false };

      const process = await generateProcessFromPrompt(prompt, companyOptions);

      expect(process.name).toContain('MEI — Registro Simplificado');
      expect(process.steps).toHaveLength(3);
      expect(process.steps[0].id).toBe('step-mei-1');
      expect(process.steps[0].status).toBe('in_progress');
      expect(process.steps[1].status).toBe('blocked');
    });

    it('should generate company opening process for Simples Nacional by default when no options provided', async () => {
      const prompt = 'abrir nova filial de loja';

      const process = await generateProcessFromPrompt(prompt);

      expect(process.name).toContain('Simples Nacional');
      expect(process.category).toBe('Jurídico & Financeiro');
      expect(process.steps).toHaveLength(5);
      expect(process.steps[0].title).toContain('Consulta Prévia de Viabilidade');
    });

    it('should generate company opening process for Lucro Presumido', async () => {
      const prompt = 'abrir empresa simples ou presumido';
      const companyOptions = { regime: 'presumido' as const, hasExistingCompany: false };

      const process = await generateProcessFromPrompt(prompt, companyOptions);

      expect(process.name).toContain('Lucro Presumido');
      expect(process.steps).toHaveLength(5);
      expect(process.steps[3].title).toContain('Lucro Presumido');
    });

    it('should generate company opening process for Lucro Real', async () => {
      const prompt = 'empresa nova';
      const companyOptions = { regime: 'real' as const, hasExistingCompany: false };

      const process = await generateProcessFromPrompt(prompt, companyOptions);

      expect(process.name).toContain('Lucro Real');
      expect(process.steps).toHaveLength(5);
    });

    it('should match buildCompanyOpeningProcess output for identical options', async () => {
      const companyOptions = { regime: 'simples' as const, hasExistingCompany: false };
      const expectedTemplate = buildCompanyOpeningProcess(companyOptions);

      const process = await generateProcessFromPrompt('abrir empresa', companyOptions);

      expect(process.name).toBe(expectedTemplate.name);
      expect(process.category).toBe(expectedTemplate.category);
      expect(process.description).toBe(expectedTemplate.description);
    });
  });

  describe('Hiring / HR intent ("contratar", "funcionário", "rh", "colaborador")', () => {
    it.each([
      ['contratar'],
      ['preciso de um novo funcionário'],
      ['processo de rh'],
      ['admitir colaborador']
    ])('should match HR hiring process template for prompt: "%s"', async (prompt) => {
      const process = await generateProcessFromPrompt(prompt);

      expect(process.name).toBe(PRESET_PROCESS_TEMPLATES['contratar_funcionario'].name);
      expect(process.category).toBe('Recursos Humanos / Operação');
      expect(process.steps).toHaveLength(6);
      expect(process.steps[0].title).toBe('Aprovação de Orçamento da Vaga');
    });
  });

  describe('Sales / B2B intent ("venda", "vendas", "comercial", "proposta", "pipeline")', () => {
    it.each([
      ['venda'],
      ['estruturar equipe de vendas'],
      ['processo comercial'],
      ['enviar proposta'],
      ['pipeline de vendas']
    ])('should match sales process template for prompt: "%s"', async (prompt) => {
      const process = await generateProcessFromPrompt(prompt);

      expect(process.name).toBe(PRESET_PROCESS_TEMPLATES['processo_vendas'].name);
      expect(process.category).toBe('Comercial / Vendas');
      expect(process.steps).toHaveLength(5);
      expect(process.steps[0].title).toBe('Prospecção e Qualificação do Lead');
    });
  });

  describe('Dynamic fallback prompt generation', () => {
    it('should generate dynamic process for unmatched prompts', async () => {
      const prompt = 'treinamento de integração para novos fornecedores';

      const process = await generateProcessFromPrompt(prompt);

      expect(process.name).toBe('Treinamento de integração para novos fornecedores');
      expect(process.category).toBe('Geral & Operações');
      expect(process.description).toContain(prompt);
      expect(process.steps).toHaveLength(4);
      expect(process.steps[0].id).toBe('gen-1');
      expect(process.steps[0].title).toContain(prompt);
      expect(process.steps[1].id).toBe('gen-2');
      expect(process.steps[2].id).toBe('gen-3');
      expect(process.steps[3].id).toBe('gen-4');
    });

    it('should properly capitalize single-word custom prompt', async () => {
      const prompt = 'auditoria';

      const process = await generateProcessFromPrompt(prompt);

      expect(process.name).toBe('Auditoria');
    });
  });

  describe('generateProcessFromDocument', () => {
    it('should generate process from document data with empty extracted text', async () => {
      const { generateProcessFromDocument } = await import('./aiService');
      const docData = {
        fileName: 'POP_Atendimento.pdf',
        fileType: 'pdf',
        extractedText: ''
      };

      const process = generateProcessFromDocument(docData);

      expect(process.name).toBe('Processo extraído de: POP_Atendimento.pdf');
      expect(process.category).toBe('Processos Internos / POP');
      expect(process.steps).toHaveLength(3);
      expect(process.steps[0].status).toBe('in_progress');
      expect(process.steps[1].status).toBe('blocked');
      expect(process.steps[2].status).toBe('blocked');
      expect(process.tags).toContain('Document IA');
    });

    it('should split document text into chunked steps with sequential dependencies', async () => {
      const { generateProcessFromDocument } = await import('./aiService');
      const docData = {
        fileName: 'Manual_Operacional.txt',
        fileType: 'txt',
        extractedText: [
          '1. Recebimento de Materiais',
          'Conferir nota fiscal e integridade da embalagem',
          '2. Armazenamento e Identificação',
          'Etiquetar e posicionar no estoque correto',
          '3. Distribuição para Produção',
          'Encaminhar insumos conforme requisição interna'
        ].join('\n')
      };

      const process = generateProcessFromDocument(docData);

      expect(process.name).toBe('Processo extraído de: Manual_Operacional.txt');
      expect(process.steps.length).toBeGreaterThan(0);
      expect(process.steps[0].status).toBe('in_progress');
      if (process.steps.length > 1) {
        expect(process.steps[1].dependencies[0].dependsOnStepId).toBe(process.steps[0].id);
      }
    });

    it('should truncate long step titles and descriptions', async () => {
      const { generateProcessFromDocument } = await import('./aiService');
      const longTitle = 'A'.repeat(80);
      const longDesc = 'B'.repeat(200);
      const docData = {
        fileName: 'POP_Longo.pdf',
        fileType: 'pdf',
        extractedText: [
          longTitle,
          longDesc,
          'Etapa 2',
          'Etapa 3',
          'Etapa 4',
          'Etapa 5'
        ].join('\n')
      };

      const process = generateProcessFromDocument(docData);

      expect(process.steps[0].title.length).toBeLessThanOrEqual(60);
      expect(process.steps[0].title.endsWith('...')).toBe(true);
      expect(process.steps[0].description.length).toBeLessThanOrEqual(180);
      expect(process.steps[0].description.endsWith('...')).toBe(true);
    });
  });

  describe('General process attributes & edge cases', () => {
    it('should trim whitespace and handle uppercase input', async () => {
      const prompt = '   ABRIR EMPRESA   ';

      const process = await generateProcessFromPrompt(prompt);

      expect(process.name).toContain('Abertura de Empresa');
    });

    it('should generate a valid Process object with metadata and metrics', async () => {
      const process = await generateProcessFromPrompt('vendas');

      expect(process.id).toMatch(/^proc-\d+$/);
      expect(process.isActive).toBe(true);
      expect(process.createdAt).toBeDefined();
      expect(process.updatedAt).toBeDefined();
      expect(process.participants).toEqual(['Você (Gestor)', 'Diretoria Financeira', 'RH / Operação']);
      expect(process.tags).toEqual(['IA Assisted', 'Vurio Core']);
      expect(process.metrics).toBeDefined();
      expect(typeof process.metrics?.healthScore).toBe('number');
      expect(typeof process.metrics?.timeSavedHours).toBe('number');
      expect(typeof process.metrics?.criticalPathCount).toBe('number');
    });
  });
});
