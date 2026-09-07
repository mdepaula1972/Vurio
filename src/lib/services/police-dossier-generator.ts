export interface PoliceDossierData {
  incidentId: string;
  doctor: {
    name: string;
    crm: string;
    uf: string;
    cpf?: string | null;
  };
  patient: {
    name?: string | null;
    cpf?: string | null;
  };
  company: {
    tradeName: string;
    cnpj?: string | null;
  };
  document: {
    fileName: string;
    fileSha256: string;
    presentationDate: string;
    restDaysClaimed?: number | null;
    technicalInconsistencies: string[];
  };
  repudiationStatement: {
    declaredAt: string;
    ipAddress?: string | null;
    statementText: string;
  };
}

/**
 * Gera o dossiê pericial estruturado pronto para protocolo na Delegacia Eletrônica da Polícia Civil
 * Tipificação Penal: Arts. 299 (Falsidade Ideológica) e 304 (Uso de Documento Falso) do Código Penal.
 */
export function generatePoliceDossier(data: PoliceDossierData): {
  plainTextReport: string;
  legalSummary: string;
  incidentCode: string;
} {
  const incidentCode = `VURIO-BO-${data.doctor.uf}-${data.doctor.crm}-${Date.now().toString(36).toUpperCase()}`;

  const plainTextReport = `================================================================================
RELATÓRIO TÉCNICO-PERICIAL E NOTÍCIA DE FATO DELITUOSO
PROTOCOLO SUGERIDO: DELEGACIA ELETRÔNICA DA POLÍCIA CIVIL
CÓDIGO DE AUDITORIA VURIO: ${incidentCode}
================================================================================

I. QUALIFICAÇÃO DO PROFISSIONAL MÉDICO (VÍTIMA)
Nome: ${data.doctor.name}
CRM: ${data.doctor.crm}/${data.doctor.uf}
CPF: ${data.doctor.cpf || 'Não informado / Cadastro sob sigilo'}
Qualidade: Médico titular do CRM indevidamente utilizado por falsário.

II. TIPIFICAÇÃO PENAL EM TESE
- Art. 299 do Código Penal: Falsidade Ideológica
- Art. 304 do Código Penal: Uso de Documento Falso
- Art. 282 do Código Penal: Exercício Ilegal da Medicina (caso o subscritor não seja médico)

III. DADOS DO ESTABELECIMENTO PREJUDICADO (EMPRESA DESTINATÁRIA)
Empresa: ${data.company.tradeName}
CNPJ: ${data.company.cnpj || 'Sob custódia do Departamento Pessoal'}
Apresentado em: ${data.document.presentationDate}

IV. DADOS DO DOCUMENTO OBJETO DA FRAUDE
Arquivo: ${data.document.fileName}
Hash Criptográfico SHA-256: ${data.document.fileSha256}
Dias de afastamento pleiteados: ${data.document.restDaysClaimed ? `${data.document.restDaysClaimed} dia(s)` : 'Não especificado'}
Inconsistências Técnicas Detectadas:
${data.document.technicalInconsistencies.map(i => `  • ${i}`).join('\n')}

V. QUALIFICAÇÃO DO BENEFICIÁRIO DO DOCUMENTO
Paciente/Colaborador: ${data.patient.name || 'Constante no corpo do documento'}
CPF: ${data.patient.cpf || 'Conforme cadastro no RH da empresa'}

VI. DECLARAÇÃO FORMAL DE REPÚDIO E INAUTENTICIDADE
O médico subscritor, Dr(a). ${data.doctor.name}, expressamente declarou por meio da 
plataforma Vurio em ${data.repudiationStatement.declaredAt} (IP de registro: ${data.repudiationStatement.ipAddress || 'Registrado via WhatsApp Verificado'}):

"${data.repudiationStatement.statementText}"

VII. CONCLUSÃO E PROVA MATERIAL
A presente certidão é gerada com base em análise criptográfica e manifestação expressa 
do profissional, constituindo elemento hábil para abertura de Inquérito Policial 
e juntada aos autos do procedimento interno disciplinar com respaldo no art. 482, 'a' da CLT.

Registro de Integridade Criptográfica Vurio ID: ${data.incidentId}
================================================================================`;

  const legalSummary = `Notícia-crime de uso de atestado adulterado com o CRM ${data.doctor.crm}/${data.doctor.uf}. O médico titular repudiou expressamente a emissão em ${data.repudiationStatement.declaredAt}. Hash SHA-256: ${data.document.fileSha256}.`;

  return {
    plainTextReport,
    legalSummary,
    incidentCode
  };
}
