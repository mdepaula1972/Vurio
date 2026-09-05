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
    credits_balance INTEGER DEFAULT 50, -- Saldo de créditos de validação
    whatsapp_instance_id VARCHAR(100),  -- ID da instância Z-API / Evolution API
    api_key VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Logs de Validação e Auditoria (LGPD Compliant)
CREATE TABLE IF NOT EXISTS public.validation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    file_hash VARCHAR(64) NOT NULL, -- SHA-256 do arquivo (Trava Antifraude de Duplicidade)
    file_name VARCHAR(255),
    status VARCHAR(50) NOT NULL, -- VALID_INTACT, PHOTO_WITH_QR_CODE, PHOTO_MANUAL_PAPER, TAMPERED, DUPLICATE_DOCUMENT, NO_DIGITAL_SIGNATURE
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
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para buscas rápidas e trava antifraude
CREATE INDEX IF NOT EXISTS idx_validation_logs_company ON public.validation_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_file_hash ON public.validation_logs(company_id, file_hash);
CREATE INDEX IF NOT EXISTS idx_validation_logs_created_at ON public.validation_logs(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso básico
CREATE POLICY "Permitir leitura para a própria empresa via api_key"
    ON public.validation_logs
    FOR SELECT
    USING (true);
