-- ==============================================================================
-- TABELA DE LEADS (ANÚNCIOS VURIO) & DEDUPLICAÇÃO DE WEBHOOK
-- CONFORMIDADE LGPD: Minimização estrita de dados. Armazena apenas o estritamente
-- necessário para medição de interesse comercial (sem anexos, sem diagnósticos).
-- RLS Habilitado sem políticas públicas: Acesso exclusivo via Service Role.
-- ==============================================================================

-- 1. Tabela de Leads de Anúncios
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(30) UNIQUE NOT NULL,
    ref VARCHAR(50),                         -- Código opcional [ref:xxx] para rastreio de criativo/campanha
    first_message_text TEXT,                 -- Texto da 1ª mensagem para histórico
    first_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    message_count INTEGER DEFAULT 1 NOT NULL, -- Quantidade de mensagens recebidas do lead
    last_auto_reply_at TIMESTAMP WITH TIME ZONE,
    opt_out BOOLEAN DEFAULT false NOT NULL,  -- Flag caso o lead envie 'sair' ou 'parar'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Deduplicação de Mensagens de Webhook (Evita reenvios e contagem inflada)
CREATE TABLE IF NOT EXISTS public.webhook_processed_messages (
    message_id VARCHAR(120) PRIMARY KEY,
    phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para busca rápida e contagem do placar
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_ref ON public.leads(ref);
CREATE INDEX IF NOT EXISTS idx_leads_first_message_at ON public.leads(first_message_at);
CREATE INDEX IF NOT EXISTS idx_leads_last_message_at ON public.leads(last_message_at);
CREATE INDEX IF NOT EXISTS idx_webhook_processed_created_at ON public.webhook_processed_messages(created_at);

-- 3. Habilitação de RLS (Row Level Security) SEM NENHUMA POLÍTICA PÚBLICA
-- Proteção máxima: Nenhuma chave anônima ou autenticada tem permissão de leitura/escrita.
-- Somente o backend com SUPABASE_SERVICE_ROLE_KEY tem acesso.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_processed_messages ENABLE ROW LEVEL SECURITY;
