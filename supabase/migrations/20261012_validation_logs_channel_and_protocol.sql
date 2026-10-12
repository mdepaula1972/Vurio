-- ==============================================================================
-- MIGRATION: SEGREGAÇÃO DE CANAL, PROTOCOLO DE ENTREGA E METADADOS FORENSES
-- Tabela afetada: public.validation_logs
-- Conformidade LGPD: Zero Storage de binários e Zero persistência de CID.
-- ==============================================================================

-- 1. Adicionar colunas de Protocolo, Canal, Colaborador e Laudo Pericial Sanitizado
ALTER TABLE public.validation_logs
    ADD COLUMN IF NOT EXISTS protocol_id VARCHAR(30),
    ADD COLUMN IF NOT EXISTS channel VARCHAR(20) DEFAULT 'WEB',
    ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS patient_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS forensic_report JSONB;

-- 2. Índices de busca e auditoria para o Dashboard do DP
CREATE INDEX IF NOT EXISTS idx_validation_logs_protocol_id ON public.validation_logs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_channel ON public.validation_logs(channel);
CREATE INDEX IF NOT EXISTS idx_validation_logs_sender_phone ON public.validation_logs(sender_phone);
CREATE INDEX IF NOT EXISTS idx_validation_logs_company_created ON public.validation_logs(company_id, created_at DESC);

-- 3. Comentários para documentação de auditoria
COMMENT ON COLUMN public.validation_logs.protocol_id IS 'Identificador oficial e legível do protocolo de entrega do atestado (ex: #VR-3F41AAD2)';
COMMENT ON COLUMN public.validation_logs.channel IS 'Canal de ingestão: WHATSAPP (Evolution API) ou WEB (Upload de Balcão no Dashboard)';
COMMENT ON COLUMN public.validation_logs.sender_phone IS 'Telefone do colaborador que realizou a entrega via WhatsApp para contato do DP';
COMMENT ON COLUMN public.validation_logs.patient_name IS 'Nome do colaborador/paciente extraído do documento médico';
COMMENT ON COLUMN public.validation_logs.forensic_report IS 'Diagnóstico pericial completo (PAdES, CFM, Geo-Shield e Inconsistências). Estritamente sem CID ou arquivos brutos.';
