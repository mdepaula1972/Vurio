-- ==============================================================================
-- MIGRAÇÃO VURIO GARÇOM: REGRAS DE NEGÓCIO AVANÇADAS, RATEIO E PROTOCOLO DE SEGURANÇA
-- Data: 19/10/2026
-- ==============================================================================

-- 1. Limite de comanda na tabela de estabelecimentos
ALTER TABLE IF EXISTS public.establishments 
ADD COLUMN IF NOT EXISTS max_tab_limit NUMERIC(10,2) DEFAULT 250.00;

ALTER TABLE IF EXISTS public.estabelecimentos 
ADD COLUMN IF NOT EXISTS max_tab_limit NUMERIC(10,2) DEFAULT 250.00;

-- Atualizar sessões de mesa com informações de verificação e limite
ALTER TABLE IF EXISTS public.table_sessions 
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS verified_adult BOOLEAN DEFAULT NULL;

-- 2. Tabela de Consentimento Legal +18
CREATE TABLE IF NOT EXISTS public.client_age_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_phone VARCHAR(50) UNIQUE NOT NULL,
    is_adult BOOLEAN NOT NULL DEFAULT false,
    consent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Itens Compartilhados / Rateio de Mesa (shared_order_items)
CREATE TABLE IF NOT EXISTS public.shared_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.table_sessions(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    primary_client_phone TEXT NOT NULL,
    invited_client_phone TEXT NOT NULL,
    split_ratio NUMERIC(3,2) DEFAULT 0.50,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE NULL
);

-- 4. Tabela de Alertas de Segurança Discreta (Protocolo Não é Não)
CREATE TABLE IF NOT EXISTS public.safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    client_phone TEXT,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'attended', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    attended_at TIMESTAMP WITH TIME ZONE NULL
);

-- 5. Índices de Performance
CREATE INDEX IF NOT EXISTS idx_shared_order_items_session ON public.shared_order_items(session_id, status);
CREATE INDEX IF NOT EXISTS idx_safety_alerts_establishment ON public.safety_alerts(establishment_id, status);
CREATE INDEX IF NOT EXISTS idx_client_age_consents_phone ON public.client_age_consents(client_phone);

-- 6. Habilitar RLS com Políticas Abertas para Operação Ágil
ALTER TABLE public.client_age_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir acesso client_age_consents" ON public.client_age_consents;
    CREATE POLICY "Permitir acesso client_age_consents" ON public.client_age_consents FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir acesso shared_order_items" ON public.shared_order_items;
    CREATE POLICY "Permitir acesso shared_order_items" ON public.shared_order_items FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir acesso safety_alerts" ON public.safety_alerts;
    CREATE POLICY "Permitir acesso safety_alerts" ON public.safety_alerts FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 7. Realtime Publication
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_alerts, public.shared_order_items;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN undefined_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;
