import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { createDoctorIncident } from './doctor-shield-service';

export interface VerificationInquiry {
  id: string;
  validationLogId?: string;
  companyId: string;
  token: string;
  doctorCrm: string;
  doctorUf: string;
  doctorName?: string;
  patientName?: string;
  patientCpf?: string;
  clinicName?: string;
  clinicContact?: string;
  status: 'PENDING' | 'CONFIRMED_GENUINE' | 'REPUDIATED_BY_DOCTOR' | 'EXPIRED';
  responseNotes?: string;
  respondedAt?: string;
  respondedIp?: string;
  createdAt: string;
}

// Fallback em memória para desenvolvimento e testes
const inMemoryInquiries: Record<string, VerificationInquiry> = {};

/**
 * Cria uma diligência de 1 clique para uma clínica ou médico
 */
export async function createVerificationInquiry(params: {
  validationLogId?: string;
  companyId: string;
  doctorCrm: string;
  doctorUf: string;
  doctorName?: string;
  patientName?: string;
  patientCpf?: string;
  clinicName?: string;
  clinicContact?: string;
}): Promise<VerificationInquiry> {
  const token = crypto.randomBytes(24).toString('hex');
  const inquiry: VerificationInquiry = {
    id: `inq-${Date.now()}`,
    validationLogId: params.validationLogId,
    companyId: params.companyId,
    token,
    doctorCrm: params.doctorCrm,
    doctorUf: params.doctorUf,
    doctorName: params.doctorName || 'Médico Identificado',
    patientName: params.patientName || 'Paciente',
    patientCpf: params.patientCpf,
    clinicName: params.clinicName,
    clinicContact: params.clinicContact,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  inMemoryInquiries[token] = inquiry;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('verification_inquiries')
        .insert({
          validation_log_id: params.validationLogId,
          company_id: params.companyId,
          token,
          doctor_crm: params.doctorCrm,
          doctor_uf: params.doctorUf,
          doctor_name: params.doctorName,
          patient_name: params.patientName,
          patient_cpf: params.patientCpf,
          clinic_name: params.clinicName,
          clinic_contact: params.clinicContact,
          status: 'PENDING'
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          validationLogId: data.validation_log_id,
          companyId: data.company_id,
          token: data.token,
          doctorCrm: data.doctor_crm,
          doctorUf: data.doctor_uf,
          doctorName: data.doctor_name,
          patientName: data.patient_name,
          patientCpf: data.patient_cpf,
          clinicName: data.clinic_name,
          clinicContact: data.clinic_contact,
          status: data.status,
          createdAt: data.created_at
        };
      }
    } catch (err) {
      console.warn('Fallback em memória para diligências (Supabase não respondeu):', err);
    }
  }

  return inquiry;
}

/**
 * Busca os dados de uma diligência a partir do token
 */
export async function getInquiryByToken(token: string): Promise<VerificationInquiry | null> {
  if (inMemoryInquiries[token]) {
    return inMemoryInquiries[token];
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('verification_inquiries')
        .select('*')
        .eq('token', token)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          validationLogId: data.validation_log_id,
          companyId: data.company_id,
          token: data.token,
          doctorCrm: data.doctor_crm,
          doctorUf: data.doctor_uf,
          doctorName: data.doctor_name,
          patientName: data.patient_name,
          patientCpf: data.patient_cpf,
          clinicName: data.clinic_name,
          clinicContact: data.clinic_contact,
          status: data.status,
          responseNotes: data.response_notes,
          respondedAt: data.responded_at,
          respondedIp: data.responded_ip,
          createdAt: data.created_at
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Registra a resposta da clínica/médico à diligência
 */
export async function answerInquiry(params: {
  token: string;
  action: 'CONFIRM' | 'REPUDIATE';
  notes?: string;
  ipAddress?: string;
}): Promise<{
  success: boolean;
  status: 'CONFIRMED_GENUINE' | 'REPUDIATED_BY_DOCTOR';
  officialStatement: string;
  dpNotification: string;
  employeeNotification: string;
}> {
  const inquiry = await getInquiryByToken(params.token);
  if (!inquiry) {
    throw new Error('Diligência não encontrada ou token inválido.');
  }

  const respondedAt = new Date().toISOString();
  const status = params.action === 'CONFIRM' ? 'CONFIRMED_GENUINE' : 'REPUDIATED_BY_DOCTOR';

  inquiry.status = status;
  inquiry.respondedAt = respondedAt;
  inquiry.respondedIp = params.ipAddress;
  inquiry.responseNotes = params.notes;

  let officialStatement = '';
  let dpNotification = '';
  let employeeNotification = '';

  if (status === 'CONFIRMED_GENUINE') {
    officialStatement = `CERTIDÃO DE CONFIRMAÇÃO DIRETA DO EMISSOR: O profissional médico Dr(a). ${inquiry.doctorName} (CRM ${inquiry.doctorCrm}/${inquiry.doctorUf}) confirmou expressamente em ${respondedAt} a legitimidade do atendimento prestado ao paciente ${inquiry.patientName}.`;
    
    dpNotification = `✅ *Diligência Concluída com Sucesso (Confirmação Médica)*\n\n` +
      `O Dr(a). ${inquiry.doctorName} (CRM ${inquiry.doctorCrm}/${inquiry.doctorUf}) confirmou formalmente a procedência do atestado referente a *${inquiry.patientName}*.\n\n` +
      `📌 *Nota de Responsabilidade Vurio:* Embora o documento não tenha sido autenticado pela criptografia digital ICP-Brasil (formato físico/foto/conversão), a verificação direta com o emissor atesta a sua boa-fé. O documento está apto para abono sem prejuízo ao colaborador.`;

    employeeNotification = `Olá, ${inquiry.patientName}! Seu atestado médico foi verificado diretamente junto ao Dr(a). ${inquiry.doctorName} e teve sua procedência confirmada. O documento foi liberado com sucesso junto ao Departamento Pessoal.`;

    // Atualiza log no Supabase se existir
    if (isSupabaseConfigured && supabase && inquiry.validationLogId) {
      await supabase
        .from('validation_logs')
        .update({
          status: 'CONFIRMED_BY_DOCTOR',
          is_authentic: true,
          inquiry_status: 'CONFIRMED'
        })
        .eq('id', inquiry.validationLogId);
    }
  } else {
    officialStatement = `CERTIDÃO DE REPÚDIO E INAUTENTICIDADE: O profissional médico Dr(a). ${inquiry.doctorName} (CRM ${inquiry.doctorCrm}/${inquiry.doctorUf}) declarou expressamente em ${respondedAt} NÃO RECONHECER a emissão do atestado atribuído ao seu nome para o paciente ${inquiry.patientName}.`;

    dpNotification = `🚨 *ALERTA DE REPÚDIO MÉDICO FORMAL*\n\n` +
      `O médico titular do CRM informado (Dr(a). ${inquiry.doctorName} - CRM ${inquiry.doctorCrm}/${inquiry.doctorUf}) declarou formalmente *NÃO TER EMITIDO* o documento apresentado por *${inquiry.patientName}*.\n\n` +
      `O Vurio gerou o Laudo Pericial com Declaração de Falsidade e o Dossiê para B.O. Policial. O RH possui respaldo fático integral para medidas disciplinares cabíveis (Art. 482, 'a' da CLT).`;

    employeeNotification = `Olá. Identificamos uma inconsistência formal no atestado apresentado. Por favor, compareça presencialmente ao Departamento Pessoal nas próximas 24h munido do documento original.`;

    // Registrar incidente para o médico
    await createDoctorIncident({
      doctorCrm: inquiry.doctorCrm,
      doctorUf: inquiry.doctorUf,
      doctorName: inquiry.doctorName || 'Médico Titular',
      patientName: inquiry.patientName,
      companyName: 'Empresa Contratante',
      fileName: 'atestado_questionado.pdf',
      fileSha256: 'sha256-diligencia-' + inquiry.token.substring(0, 16),
      ipAddress: params.ipAddress
    });

    if (isSupabaseConfigured && supabase && inquiry.validationLogId) {
      await supabase
        .from('validation_logs')
        .update({
          status: 'TAMPERED',
          is_authentic: false,
          inquiry_status: 'REPUDIATED'
        })
        .eq('id', inquiry.validationLogId);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('verification_inquiries')
        .update({
          status,
          response_notes: params.notes,
          responded_at: respondedAt,
          responded_ip: params.ipAddress
        })
        .eq('token', params.token);
    } catch (e) {
      console.warn('Erro ao atualizar diligência no Supabase:', e);
    }
  }

  return {
    success: true,
    status,
    officialStatement,
    dpNotification,
    employeeNotification
  };
}

/**
 * Retorna lista de diligências recentes
 */
export async function getRecentInquiries(companyId?: string): Promise<VerificationInquiry[]> {
  const inMem = Object.values(inMemoryInquiries).filter(i => !companyId || i.companyId === companyId);

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase
        .from('verification_inquiries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(d => ({
          id: d.id,
          validationLogId: d.validation_log_id,
          companyId: d.company_id,
          token: d.token,
          doctorCrm: d.doctor_crm,
          doctorUf: d.doctor_uf,
          doctorName: d.doctor_name,
          patientName: d.patient_name,
          patientCpf: d.patient_cpf,
          clinicName: d.clinic_name,
          clinicContact: d.clinic_contact,
          status: d.status,
          responseNotes: d.response_notes,
          respondedAt: d.responded_at,
          respondedIp: d.responded_ip,
          createdAt: d.created_at
        }));
      }
    } catch {
      return inMem;
    }
  }

  return inMem;
}
