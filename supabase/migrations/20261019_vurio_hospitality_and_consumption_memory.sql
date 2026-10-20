-- ==============================================================================
-- MIGRAÇÃO VURIO GARÇOM: INTELIGÊNCIA DE HOSPITALIDADE, MEMÓRIA DE CONSUMO E COUVERT/10%
-- Data: 19/10/2026
-- ==============================================================================

-- 1. Novos campos na tabela establishments
ALTER TABLE IF EXISTS public.establishments 
ADD COLUMN IF NOT EXISTS enable_spending_limits BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS silent_alert_limit NUMERIC(10,2) NULL,
ADD COLUMN IF NOT EXISTS high_value_limit NUMERIC(10,2) NULL,
ADD COLUMN IF NOT EXISTS daily_event_title TEXT NULL,
ADD COLUMN IF NOT EXISTS daily_event_description TEXT NULL,
ADD COLUMN IF NOT EXISTS couvert_fee NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS couvert_info TEXT NULL,
ADD COLUMN IF NOT EXISTS service_fee_percent NUMERIC(4,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS service_fee_enabled BOOLEAN DEFAULT true;

-- Compatibilidade na tabela estabelecimentos
ALTER TABLE IF EXISTS public.estabelecimentos 
ADD COLUMN IF NOT EXISTS enable_spending_limits BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS silent_alert_limit NUMERIC(10,2) NULL,
ADD COLUMN IF NOT EXISTS high_value_limit NUMERIC(10,2) NULL,
ADD COLUMN IF NOT EXISTS daily_event_title TEXT NULL,
ADD COLUMN IF NOT EXISTS daily_event_description TEXT NULL,
ADD COLUMN IF NOT EXISTS couvert_fee NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS couvert_info TEXT NULL,
ADD COLUMN IF NOT EXISTS service_fee_percent NUMERIC(4,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS service_fee_enabled BOOLEAN DEFAULT true;

-- 2. Tabela de Clientes com Memória e Histórico (clients)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NULL,
    visit_count INT DEFAULT 1,
    average_ticket NUMERIC(10,2) DEFAULT 0.00,
    favorite_items JSONB DEFAULT '[]'::jsonb,
    last_first_order_item TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Alertas Internos de Consumo (+40% da Média ou Teto da Casa)
CREATE TABLE IF NOT EXISTS public.internal_consumption_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.table_sessions(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    client_phone TEXT,
    client_name TEXT,
    current_consumption NUMERIC(10,2) NOT NULL,
    average_ticket NUMERIC(10,2) NOT NULL,
    percent_above NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'acknowledged')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);
CREATE INDEX IF NOT EXISTS idx_consumption_alerts_establishment ON public.internal_consumption_alerts(establishment_id, status);

-- 5. RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_consumption_alerts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir acesso clients" ON public.clients;
    CREATE POLICY "Permitir acesso clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir acesso internal_consumption_alerts" ON public.internal_consumption_alerts;
    CREATE POLICY "Permitir acesso internal_consumption_alerts" ON public.internal_consumption_alerts FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 6. Realtime
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_consumption_alerts;
    EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN others THEN NULL;
    END;
END $$;

-- 7. Dados Iniciais de Demonstração
-- Atualizar o estabelecimento padrão com evento, couvert e taxas
UPDATE public.establishments
SET 
    daily_event_title = 'Show Acústico: Pop Rock & MPB',
    daily_event_description = 'Voz & Violão no salão a partir das 20h30',
    couvert_fee = 12.00,
    couvert_info = 'Música ao vivo no salão',
    service_fee_enabled = true,
    service_fee_percent = 10.00,
    enable_spending_limits = true,
    silent_alert_limit = 120.00,
    high_value_limit = 280.00
WHERE slug = 'exemplo' OR id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Inserir cliente habitual de teste
INSERT INTO public.clients (phone, name, visit_count, average_ticket, favorite_items, last_first_order_item)
VALUES (
    '5511999990001',
    'Marcos',
    4,
    75.00,
    '["Chopp IPA Artesanal 500ml", "Burger Artesanal Vurio", "Batata Rústica com Alecrim"]'::jsonb,
    'Chopp IPA Artesanal 500ml'
)
ON CONFLICT (phone) DO UPDATE 
SET 
    name = EXCLUDED.name,
    visit_count = EXCLUDED.visit_count,
    average_ticket = EXCLUDED.average_ticket,
    favorite_items = EXCLUDED.favorite_items,
    last_first_order_item = EXCLUDED.last_first_order_item;
