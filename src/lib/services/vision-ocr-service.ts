/**
 * Vurio - Serviço de OCR e Visão Computacional para Atestados Físicos
 * Utiliza o Google Gemini 3.8 Flash para leitura pericial de fotos de receituários e documentos médicos.
 */

export interface ExtractedAttestationData {
  isMedicalAttestation: boolean;
  doctorName: string | null;
  crm: string | null;
  uf: string | null;
  councilType?: 'CRM' | 'CRO' | 'CRP' | 'CREFITO' | 'CRN' | 'RMS' | null;
  councilNumber?: string | null;
  professionalTitle?: string | null;
  patientName: string | null;
  patientCpf: string | null;
  emissionDate: string | null;
  startDate: string | null;
  days: number | null;
  cid: string | null;
  clinicName: string | null;
  rawExtractedText?: string;
  source: 'GEMINI_VISION' | 'HEURISTIC_FALLBACK';
}

/**
 * Prompt pericial de alta precisão para extração médica
 */
const FORENSIC_OCR_PROMPT = `
Você é um perito forense e auditor médico do Vurio. Sua tarefa é analisar minuciosamente esta imagem e verificar se trata-se de um atestado médico físico, receituário, declaração de comparecimento ou documento de saúde.

Retorne EXCLUSIVAMENTE um objeto JSON válido (sem blocos de markdown, sem explicações extras) com a seguinte estrutura:
{
  "isMedicalAttestation": true,
  "councilType": "Sigla do conselho profissional emitente: CRM (médico), CRO (odontologia/dentista), CRP (psicólogo), CREFITO (fisioterapeuta) ou CRN (nutricionista). Padrão: CRM",
  "doctorName": "Nome completo do profissional de saúde identificado no carimbo ou cabeçalho (sem título Dr.)",
  "crm": "Apenas os dígitos do registro no conselho profissional",
  "uf": "Duas letras da sigla do estado do conselho (ex: SP, RJ, MG)",
  "patientName": "Nome completo do paciente atendido",
  "patientCpf": "CPF ou RG do paciente se visível",
  "emissionDate": "Data do atestado no formato DD/MM/AAAA",
  "startDate": "Data de início do repouso no formato DD/MM/AAAA",
  "days": 3,
  "cid": "Código do CID-10 se mencionado (ex: J00, J06, M54)",
  "clinicName": "Nome da clínica, hospital ou consultório impresso"
}

REGRAS CRÍTICAS:
1. Se a imagem NÃO for um atestado médico, receituário, declaração clínica ou documento da área da saúde (por exemplo: for uma foto comum, contrato, comprovante de pagamento, holerite, nota fiscal ou documento aleatório), defina "isMedicalAttestation": false e defina todos os outros campos como null.
2. Se for um atestado médico, defina "isMedicalAttestation": true. Se algum campo específico não estiver legível ou ausente na imagem, defina seu valor como null.
`.trim();

/**
 * Extrai dados estruturados de um buffer de imagem (JPEG/PNG)
 */
export async function extractAttestationFromImageBuffer(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedAttestationData> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_KEY ||
    process.env.GOOGLE_API_KEY ||
    '';

  // 1. Se possuir chave do Google AI Studio configurada, utiliza o Gemini Vision (com fallback resiliente)
  if (apiKey) {
    const base64Image = imageBuffer.toString('base64');
    const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: FORENSIC_OCR_PROMPT },
                  {
                    inlineData: {
                      mimeType: mimeType || 'image/jpeg',
                      data: base64Image
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json'
            }
          })
        });

        if (response.ok) {
          const json = await response.json();
          const rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (rawContent) {
            const cleanJson = rawContent
              .replace(/```json/gi, '')
              .replace(/```/g, '')
              .trim();
            const parsed = JSON.parse(cleanJson);

            const isMedical = parsed.isMedicalAttestation !== false;

            const rawCouncil = parsed.councilType ? String(parsed.councilType).toUpperCase().trim() : (parsed.crm ? 'CRM' : null);
            const validCouncil = (rawCouncil && ['CRM', 'CRO', 'CRP', 'CREFITO', 'CRN', 'RMS'].includes(rawCouncil)) ? rawCouncil : 'CRM';
            const num = isMedical && parsed.crm ? String(parsed.crm).replace(/\D/g, '') : null;

            return {
              isMedicalAttestation: isMedical,
              doctorName: isMedical ? (parsed.doctorName || null) : null,
              crm: validCouncil === 'CRM' ? num : null,
              councilType: isMedical ? (validCouncil as any) : null,
              councilNumber: isMedical ? num : null,
              professionalTitle: validCouncil === 'CRO' ? 'Cirurgião-Dentista' : validCouncil === 'CRP' ? 'Psicólogo(a)' : 'Médico(a)',
              uf: isMedical && parsed.uf ? String(parsed.uf).toUpperCase() : (isMedical ? 'SP' : null),
              patientName: isMedical ? (parsed.patientName || null) : null,
              patientCpf: isMedical ? (parsed.patientCpf || null) : null,
              emissionDate: isMedical ? (parsed.emissionDate || null) : null,
              startDate: isMedical ? (parsed.startDate || parsed.emissionDate || null) : null,
              days: isMedical && parsed.days ? parseInt(parsed.days, 10) : null,
              cid: isMedical ? (parsed.cid || null) : null,
              clinicName: isMedical ? (parsed.clinicName || null) : null,
              rawExtractedText: rawContent,
              source: 'GEMINI_VISION'
            };
          }
        } else {
          console.warn(`[VisionOCR] Modelo ${model} retornou status ${response.status}. Tentando modelo alternativo...`);
        }
      } catch (err) {
        console.warn(`[VisionOCR] Erro ao chamar modelo ${model}:`, (err as any)?.message || 'Falha na requisição');
      }
    }
  }

  // 2. Fallback sem chave ou em erro de rede:
  // Retorna seguro sem inventar médicos ou CRMs fictícios
  return parseHeuristicFromImage(imageBuffer);
}

/**
 * Fallback seguro quando a visão computacional não estiver acessível
 */
function parseHeuristicFromImage(imageBuffer: Buffer): ExtractedAttestationData {
  return {
    isMedicalAttestation: false,
    doctorName: null,
    crm: null,
    uf: null,
    patientName: null,
    patientCpf: null,
    emissionDate: null,
    startDate: null,
    days: null,
    cid: null,
    clinicName: null,
    rawExtractedText: '',
    source: 'HEURISTIC_FALLBACK'
  };
}
