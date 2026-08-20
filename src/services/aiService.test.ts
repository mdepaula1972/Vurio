import { describe, it, expect } from 'vitest';
import { generateProcessFromDocument } from './aiService';
import { DocumentUploadData } from '../engine/types';

describe('generateProcessFromDocument', () => {
  it('handles empty or whitespace-only extractedText by using default fallback lines', () => {
    const docData: DocumentUploadData = {
      fileName: 'manual_vazio.pdf',
      fileType: 'pdf',
      extractedText: '   \n  \n\n '
    };

    const result = generateProcessFromDocument(docData);

    expect(result.name).toBe('Processo extraído de: manual_vazio.pdf');
    expect(result.description).toContain('manual_vazio.pdf');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[0].title).toBe('Planejamento Inicial do Documento');
    expect(result.steps[1].title).toBe('Execução das Etapas Operacionais');
    expect(result.steps[2].title).toBe('Validação e Encerramento');
  });

  it('correctly parses multi-line text into sequential steps with dependencies', () => {
    const docData: DocumentUploadData = {
      fileName: 'pop_atendimento.pdf',
      fileType: 'pdf',
      extractedText: [
        '1. Recebimento do chamado',
        'Verificar prioridade e registrar no sistema',
        '2. Triagem e análise técnica',
        'Analisar logs e identificar causa raiz',
        '3. Resolução e contato com cliente',
        'Aplicar correção e validar com o solicitante'
      ].join('\n')
    };

    const result = generateProcessFromDocument(docData);

    expect(result.steps.length).toBe(3);

    // Step 1 assertions
    expect(result.steps[0].id).toBe('doc-step-1');
    expect(result.steps[0].title).toBe('Recebimento do chamado');
    expect(result.steps[0].description).toBe('Verificar prioridade e registrar no sistema');
    expect(result.steps[0].layer).toBe(1);
    expect(result.steps[0].status).toBe('in_progress');
    expect(result.steps[0].responsible).toEqual(['Liderança / Gestor']);
    expect(result.steps[0].dependencies).toEqual([]);

    // Step 2 assertions
    expect(result.steps[1].id).toBe('doc-step-2');
    expect(result.steps[1].title).toBe('Triagem e análise técnica');
    expect(result.steps[1].description).toBe('Analisar logs e identificar causa raiz');
    expect(result.steps[1].layer).toBe(2);
    expect(result.steps[1].status).toBe('blocked');
    expect(result.steps[1].responsible).toEqual(['Equipe Operacional / Responsável']);
    expect(result.steps[1].dependencies).toEqual([
      { dependsOnStepId: 'doc-step-1', type: 'sequential' }
    ]);

    // Step 3 assertions
    expect(result.steps[2].id).toBe('doc-step-3');
    expect(result.steps[2].title).toBe('Resolução e contato com cliente');
    expect(result.steps[2].description).toBe('Aplicar correção e validar com o solicitante');
    expect(result.steps[2].layer).toBe(3);
    expect(result.steps[2].status).toBe('blocked');
    expect(result.steps[2].dependencies).toEqual([
      { dependsOnStepId: 'doc-step-2', type: 'sequential' }
    ]);
  });

  it('strips leading list markers and truncates long titles and descriptions', () => {
    const longTitle = '1.1. - * # Esta é uma etapa com um título extremamente longo que ultrapassa o limite de sessenta caracteres permitidos';
    const longDescriptionLine1 = 'Esta é uma descrição extremamente longa que vai exceder em muito o limite de cento e oitenta caracteres definido pela função de geração de processos para garantir a legibilidade do card no sistema.';
    const longDescriptionLine2 = 'Outra linha de detalhamento da etapa para forçar a junção de linhas e consequente estouro de limite de tamanho na descrição do processo.';

    // 6 lines total -> chunkSize = Math.ceil(6 / 5) = 2 lines per chunk
    const docData: DocumentUploadData = {
      fileName: 'manual_extenso.docx',
      fileType: 'docx',
      extractedText: [
        longTitle,
        longDescriptionLine1,
        'Passo 2',
        longDescriptionLine2,
        'Passo 3',
        'Descrição 3'
      ].join('\n')
    };

    const result = generateProcessFromDocument(docData);

    const step = result.steps[0];
    // Leading list numbers and symbols should be stripped
    expect(step.title).not.toMatch(/^[\d\.\-\*\#\s]+/);
    // Title > 60 chars should be truncated to 57 chars + '...'
    expect(step.title.length).toBe(60);
    expect(step.title.endsWith('...')).toBe(true);

    // Description > 180 chars should be truncated to 177 chars + '...'
    expect(step.description.length).toBe(180);
    expect(step.description.endsWith('...')).toBe(true);
  });

  it('limits the number of generated steps to a maximum of 7', () => {
    const manyLines = Array.from({ length: 40 }, (_, i) => `Linha de instrução número ${i + 1}`).join('\n');

    const docData: DocumentUploadData = {
      fileName: 'documento_gigante.pdf',
      fileType: 'pdf',
      extractedText: manyLines
    };

    const result = generateProcessFromDocument(docData);

    expect(result.steps.length).toBeLessThanOrEqual(7);
  });

  it('includes proper process metadata and metrics via resolveProcessState', () => {
    const docData: DocumentUploadData = {
      fileName: 'pop_financeiro.pdf',
      fileType: 'pdf',
      extractedText: 'Passo 1: Conciliação Bancária\nConferir extratos e lançamentos\nPasso 2: Fechamento\nGerar relatórios de caixa'
    };

    const result = generateProcessFromDocument(docData);

    expect(result.id).toMatch(/^proc-doc-\d+/);
    expect(result.name).toBe('Processo extraído de: pop_financeiro.pdf');
    expect(result.category).toBe('Processos Internos / POP');
    expect(result.isActive).toBe(true);
    expect(result.participants).toEqual(['Você (Gestor)', 'Equipe Operacional']);
    expect(result.tags).toEqual(['Document IA', 'POP Ingestion']);

    // Process metrics calculated by resolveProcessState
    expect(result.metrics).toBeDefined();
    expect(typeof result.metrics?.healthScore).toBe('number');
    expect(result.metrics?.healthScore).toBeGreaterThanOrEqual(10);
    expect(result.metrics?.healthScore).toBeLessThanOrEqual(100);
  });
});
