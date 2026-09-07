-- ==============================================================================
-- SCHEMA DO BANCO DE DADOS: SAAS DE VALIDAÇÃO DE ATESTADOS MÉDICOS (VURIO)
-- CONFORMIDADE LGPD: Não armazena dados médicos sensíveis, diagnósticos ou CID.
-- ==============================================================================

-- 1. Tabela de Empresas Clientes (PMEs / RHs)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(18) UNIQUE,
    trade_name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'STARTER', -- STARTER, PRO, ENTERPRISE
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY', -- MONTHLY, ANNUAL (-15% desc)
    credits_balance INTEGER DEFAULT 50, -- Saldo de créditos de validação
    whatsapp_instance_id VARCHAR(100),  -- ID da instância Z-API / Evolution API
    api_key VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    average_monthly_salary NUMERIC(10,2) DEFAULT 3000.00,
    tax_regime VARCHAR(50) DEFAULT 'LUCRO_PRESUMIDO', -- SIMPLES, LUCRO_PRESUMIDO, LUCRO_REAL
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Logs de Validação e Auditoria (LGPD Compliant)
CREATE TABLE IF NOT EXISTS public.validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 do arquivo (Trava Antifraude de Duplicidade)
    file_name VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- VALID_INTACT, PHOTO_WITH_QR_CODE, PHOTO_MANUAL_PAPER, TAMPERED, DUPLICATE_DOCUMENT, NO_DIGITAL_SIGNATURE, CONFIRMED_BY_DOCTOR
    is_authentic BOOLEAN NOT NULL DEFAULT false,
    
    -- Dados Funcionais do Médico
    doctor_name VARCHAR(255),
    doctor_cpf VARCHAR(14),
    crm VARCHAR(20),
    uf VARCHAR(2),
    issuer VARCHAR(255),
    
    -- Prazos Trabalhistas (Dados Administrativos de RH, sem diagnósticos clínicos)
    rest_days INTEGER,
    start_date VARCHAR(20),
    
    -- Dados de Auditoria Técnica
    calculated_sha256 VARCHAR(64),
    expected_sha256 VARCHAR(64),
    qr_code_url TEXT,
    execution_time_ms INTEGER,
    
    -- Status de Diligência Complementar
    inquiry_status VARCHAR(50) DEFAULT 'NONE', -- NONE, PENDING, CONFIRMED, REPUDIATED
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Diligências Formais (Ofício de 1 Clique para Clínicas/Médicos)
CREATE TABLE IF NOT EXISTS public.verification_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    validation_log_id UUID REFERENCES public.validation_logs(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    doctor_crm VARCHAR(20) NOT NULL,
    doctor_uf VARCHAR(2) NOT NULL,
    doctor_name VARCHAR(255),
    patient_name VARCHAR(255),
    patient_cpf VARCHAR(14),
    clinic_name VARCHAR(255),
    clinic_contact VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, CONFIRMED_GENUINE, REPUDIATED_BY_DOCTOR, EXPIRED
    response_notes TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_ip VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Médicos Assinantes (Vurio Doctor Shield - Monitoramento de CRM)
CREATE TABLE IF NOT EXISTS public.doctor_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_name VARCHAR(255) NOT NULL,
    crm VARCHAR(20) NOT NULL,
    uf VARCHAR(2) NOT NULL,
    cpf VARCHAR(14),
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(30) NOT NULL,
    plan VARCHAR(50) DEFAULT 'DOCTOR_SHIELD', -- DOCTOR_SHIELD_MONTHLY, DOCTOR_SHIELD_ANNUAL
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(crm, uf)
);

-- 5. Tabela de Incidentes de CRM (Repúdios e Dossiês para B.O. Eletrônico)
CREATE TABLE IF NOT EXISTS public.crm_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID REFERENCES public.verification_inquiries(id) ON DELETE SET NULL,
    validation_log_id UUID REFERENCES public.validation_logs(id) ON DELETE SET NULL,
    doctor_crm VARCHAR(20) NOT NULL,
    doctor_uf VARCHAR(2) NOT NULL,
    doctor_name VARCHAR(255),
    patient_name VARCHAR(255),
    company_name VARCHAR(255),
    file_hash VARCHAR(64),
    incident_status VARCHAR(50) DEFAULT 'REPUDIATED', -- REPUDIATED, DOSSIER_GENERATED, POLICE_REPORT_SUBMITTED
    dossier_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabela de Auditorias Retroativas de Passivo (Arma de Vendas B2B & ROI)
CREATE TABLE IF NOT EXISTS public.batch_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    audit_title VARCHAR(255) DEFAULT 'Auditoria Retroativa de Passivo Trabalhista',
    total_files INTEGER NOT NULL DEFAULT 0,
    authentic_count INTEGER NOT NULL DEFAULT 0,
    inconsistent_count INTEGER NOT NULL DEFAULT 0,
    total_days_lost INTEGER NOT NULL DEFAULT 0,
    average_monthly_salary NUMERIC(10,2) DEFAULT 3000.00,
    tax_regime VARCHAR(50) DEFAULT 'LUCRO_PRESUMIDO', -- SIMPLES (8%), LUCRO_PRESUMIDO (28%), LUCRO_REAL (38%)
    tax_burden_rate NUMERIC(4,2) DEFAULT 0.28,
    daily_labor_cost NUMERIC(10,2) DEFAULT 128.00,
    total_financial_loss NUMERIC(12,2) DEFAULT 0.00,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para buscas rápidas e trava antifraude
CREATE INDEX IF NOT EXISTS idx_validation_logs_company ON public.validation_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_file_hash ON public.validation_logs(company_id, file_hash);
CREATE INDEX IF NOT EXISTS idx_validation_logs_crm ON public.validation_logs(crm, uf);
CREATE INDEX IF NOT EXISTS idx_inquiries_token ON public.verification_inquiries(token);
CREATE INDEX IF NOT EXISTS idx_inquiries_doctor ON public.verification_inquiries(doctor_crm, doctor_uf);
CREATE INDEX IF NOT EXISTS idx_doctor_sub_crm ON public.doctor_subscriptions(crm, uf);
CREATE INDEX IF NOT EXISTS idx_batch_audits_company ON public.batch_audits(company_id);

-- RLS (Row Level Security)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_audits ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso básico
CREATE POLICY "Permitir leitura logs" ON public.validation_logs FOR SELECT USING (true);
CREATE POLICY "Permitir leitura diligencias" ON public.verification_inquiries FOR SELECT USING (true);
CREATE POLICY "Permitir leitura auditorias" ON public.batch_audits FOR SELECT USING (true);
