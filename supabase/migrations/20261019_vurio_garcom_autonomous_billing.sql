-- ==============================================================================
-- MIGRAÇÃO VURIO GARÇOM: ATENDIMENTO E FECHAMENTO DE MESA AUTÔNOMO (ZERO ATRITO)
-- Data: 19/10/2026
-- ==============================================================================

-- 1. Campos de recebimento Pix na tabela de estabelecimentos
-- Compatibilidade: atualiza a tabela existente em português e a tabela padronizada em inglês
ALTER TABLE IF EXISTS public.estabelecimentos 
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS pix_key_type TEXT,
ADD COLUMN IF NOT EXISTS pix_beneficiary_name TEXT;

-- Tabela padronizada em inglês 'establishments'
CREATE TABLE IF NOT EXISTS public.establishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    pix_key TEXT,
    pix_key_type TEXT CHECK (pix_key_type IN ('cnpj', 'cpf', 'email', 'phone', 'random')),
    pix_beneficiary_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sincronizar dados existentes de estabelecimentos para establishments se houver
INSERT INTO public.establishments (id, name, slug, pix_key, pix_key_type, pix_beneficiary_name)
SELECT 
    id, 
    nome, 
    slug,
    pix_key,
    pix_key_type,
    pix_beneficiary_name
FROM public.estabelecimentos
ON CONFLICT (id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    pix_key = COALESCE(EXCLUDED.pix_key, public.establishments.pix_key),
    pix_key_type = COALESCE(EXCLUDED.pix_key_type, public.establishments.pix_key_type),
    pix_beneficiary_name = COALESCE(EXCLUDED.pix_beneficiary_name, public.establishments.pix_beneficiary_name);

-- 2. Tabela de Sessão de Mesa (table_sessions)
CREATE TABLE IF NOT EXISTS public.table_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'bill_requested', 'paid', 'closed')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE NULL
);

-- 3. Tabela de Pedidos (orders) vinculada à sessão de mesa
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.table_sessions(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'received' CHECK (status IN ('received', 'preparing', 'ready', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Vincular também coluna session_id na tabela antiga 'pedidos' caso utilizada
ALTER TABLE IF EXISTS public.pedidos 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.table_sessions(id) ON DELETE SET NULL;

-- 4. Tabela de Solicitações de Fechamento de Conta (bill_requests)
CREATE TABLE IF NOT EXISTS public.bill_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.table_sessions(id) ON DELETE CASCADE,
    total_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(30) CHECK (payment_method IN ('pix', 'card_machine', 'cash')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE NULL
);

-- 5. Tabela de Cardápio (menu_items)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category VARCHAR(100) DEFAULT 'Geral',
    is_available BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sincronizar produtos existentes para menu_items se existirem
INSERT INTO public.menu_items (id, establishment_id, name, description, price, is_available)
SELECT 
    p.id, 
    p.estabelecimento_id, 
    p.nome, 
    p.descricao, 
    p.preco, 
    p.disponivel
FROM public.produtos p
WHERE p.estabelecimento_id IN (SELECT id FROM public.establishments)
ON CONFLICT (id) DO UPDATE 
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    is_available = EXCLUDED.is_available;

-- 6. Índices para performance em alta concorrência
CREATE INDEX IF NOT EXISTS idx_establishments_slug ON public.establishments(slug);
CREATE INDEX IF NOT EXISTS idx_table_sessions_active ON public.table_sessions(establishment_id, table_number, status);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_establishment_status ON public.orders(establishment_id, status);
CREATE INDEX IF NOT EXISTS idx_bill_requests_session ON public.bill_requests(session_id, status);
CREATE INDEX IF NOT EXISTS idx_menu_items_establishment ON public.menu_items(establishment_id, category);

-- 7. Habilitar RLS (Row Level Security) com políticas públicas seguras
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para permitir funcionamento zero atrito no chat e admin/kds
DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir leitura de estabelecimentos" ON public.establishments;
    CREATE POLICY "Permitir leitura de estabelecimentos" ON public.establishments FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Permitir atualizacao estabelecimentos" ON public.establishments;
    CREATE POLICY "Permitir atualizacao estabelecimentos" ON public.establishments FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir acesso table_sessions" ON public.table_sessions;
    CREATE POLICY "Permitir acesso table_sessions" ON public.table_sessions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir acesso orders" ON public.orders;
    CREATE POLICY "Permitir acesso orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir acesso bill_requests" ON public.bill_requests;
    CREATE POLICY "Permitir acesso bill_requests" ON public.bill_requests FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir acesso menu_items" ON public.menu_items;
    CREATE POLICY "Permitir acesso menu_items" ON public.menu_items FOR ALL USING (true) WITH CHECK (true);
END $$;

-- 8. Estabelecimento demonstrativo padrão caso não exista
INSERT INTO public.establishments (id, name, slug, pix_key, pix_key_type, pix_beneficiary_name)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Vurio Gastrobar & Burger',
    'exemplo',
    '12345678000190',
    'cnpj',
    'Vurio Alimentos e Bebidas Ltda'
)
ON CONFLICT (id) DO UPDATE 
SET 
    pix_key = COALESCE(public.establishments.pix_key, '12345678000190'),
    pix_key_type = COALESCE(public.establishments.pix_key_type, 'cnpj'),
    pix_beneficiary_name = COALESCE(public.establishments.pix_beneficiary_name, 'Vurio Alimentos e Bebidas Ltda');

-- Inserir itens demonstrativos no cardápio se necessário
INSERT INTO public.menu_items (establishment_id, name, description, price, category, is_available)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Burger Artesanal Vurio', 'Pão brioche, blend 180g, queijo cheddar inglês, bacon crocante e maionese defumada', 38.90, 'Burgers', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Burger Artesanal Vurio' AND establishment_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

INSERT INTO public.menu_items (establishment_id, name, description, price, category, is_available)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Batata Rústica com Alecrim', 'Batatas fritas rústicas crocantes com sal marinho, alecrim e aioli da casa', 26.00, 'Porções', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Batata Rústica com Alecrim' AND establishment_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

INSERT INTO public.menu_items (establishment_id, name, description, price, category, is_available)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Chopp IPA Artesanal 500ml', 'Chopp artesanal aromático, notas cítricas e amargor equilibrado', 18.00, 'Bebidas', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Chopp IPA Artesanal 500ml' AND establishment_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

INSERT INTO public.menu_items (establishment_id, name, description, price, category, is_available)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gin Tônica com Especiarias', 'Gin premium, água tônica artesanal, zimbro e fatia de limão siciliano', 32.00, 'Drinks', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Gin Tônica com Especiarias' AND establishment_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

INSERT INTO public.menu_items (establishment_id, name, description, price, category, is_available)
SELECT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Brownie Quente com Gelato', 'Brownie de chocolate belga 70% com castanhas e gelato artesanal de baunilha', 24.50, 'Sobremesas', true
WHERE NOT EXISTS (SELECT 1 FROM public.menu_items WHERE name = 'Brownie Quente com Gelato' AND establishment_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
