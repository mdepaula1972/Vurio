import { supabase } from '@/lib/supabase/client';
import { 
  Establishment, 
  TableSession, 
  Order, 
  OrderItem, 
  BillRequest, 
  MenuItem, 
  TableSessionWithOrders, 
  PaymentMethod 
} from '@/lib/types/garcom';

/**
 * Busca dados do estabelecimento por slug ou id
 */
export async function getEstablishment(identifier: string): Promise<Establishment | null> {
  if (!supabase) return null;

  // Tenta por slug primeiro, depois por UUID se for o caso
  const { data: bySlug, error: errSlug } = await supabase
    .from('establishments')
    .select('*')
    .eq('slug', identifier.toLowerCase().trim())
    .maybeSingle();

  if (bySlug) return bySlug as Establishment;

  const { data: byId } = await supabase
    .from('establishments')
    .select('*')
    .eq('id', identifier)
    .maybeSingle();

  return (byId as Establishment) || null;
}

/**
 * Atualiza configurações de recebimento Pix do estabelecimento
 */
export async function updateEstablishmentPix(
  establishmentId: string, 
  pixData: { pix_key: string; pix_key_type: string; pix_beneficiary_name: string }
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('establishments')
    .update({
      pix_key: pixData.pix_key.trim(),
      pix_key_type: pixData.pix_key_type,
      pix_beneficiary_name: pixData.pix_beneficiary_name.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('id', establishmentId);

  return !error;
}

/**
 * Retorna itens do cardápio do estabelecimento
 */
export async function getMenuItems(establishmentId: string, onlyAvailable = false): Promise<MenuItem[]> {
  if (!supabase) return [];

  let query = supabase
    .from('menu_items')
    .select('*')
    .eq('establishment_id', establishmentId)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (onlyAvailable) {
    query = query.eq('is_available', true);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as MenuItem[];
}

/**
 * Adiciona ou edita item do cardápio
 */
export async function upsertMenuItem(item: Partial<MenuItem> & { establishment_id: string; name: string; price: number }): Promise<MenuItem | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('menu_items')
    .upsert({
      ...item,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as MenuItem;
}

/**
 * Altera disponibilidade de um item do cardápio
 */
export async function toggleMenuItemAvailability(itemId: string, isAvailable: boolean): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq('id', itemId);

  return !error;
}

/**
 * Obtém a sessão ativa de uma mesa ou cria uma nova com status 'open' (Zero Atrito)
 */
export async function getOrCreateActiveSession(establishmentId: string, tableNumber: string): Promise<TableSession | null> {
  if (!supabase) return null;

  const cleanTableNumber = tableNumber.replace(/[^0-9a-zA-Z\s]/g, '').trim();

  // Busca sessão aberta ou com conta solicitada
  const { data: existing, error: searchErr } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('establishment_id', establishmentId)
    .eq('table_number', cleanTableNumber)
    .in('status', ['open', 'bill_requested'])
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return existing as TableSession;
  }

  // Cria uma nova sessão aberta
  const { data: created, error: createErr } = await supabase
    .from('table_sessions')
    .insert({
      establishment_id: establishmentId,
      table_number: cleanTableNumber,
      status: 'open',
      opened_at: new Date().toISOString()
    })
    .select()
    .single();

  if (createErr || !created) {
    console.error('Erro ao criar sessão de mesa:', createErr);
    return null;
  }

  return created as TableSession;
}

/**
 * Busca todos os pedidos de uma sessão
 */
export async function getSessionOrders(sessionId: string): Promise<Order[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as Order[];
}

/**
 * Registra um novo pedido vinculado à sessão de mesa
 */
export async function createOrder(params: {
  establishment_id: string;
  session_id: string;
  table_number: string;
  items: OrderItem[];
  notes?: string;
}): Promise<Order | null> {
  if (!supabase) return null;

  const totalAmount = params.items.reduce((acc, item) => acc + (item.total_price || item.unit_price * item.quantity), 0);

  const { data, error } = await supabase
    .from('orders')
    .insert({
      establishment_id: params.establishment_id,
      session_id: params.session_id,
      table_number: params.table_number,
      items: params.items,
      total_amount: Number(totalAmount.toFixed(2)),
      status: 'received',
      notes: params.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao criar pedido:', error);
    return null;
  }

  return data as Order;
}

/**
 * Atualiza status de um pedido na Cozinha/KDS
 */
export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  return !error;
}

/**
 * Calcula extrato consolidado de uma sessão
 */
export async function getSessionSummary(sessionId: string): Promise<{
  orders: Order[];
  items_summary: { name: string; quantity: number; unit_price: number; total: number }[];
  total_amount: number;
}> {
  const orders = await getSessionOrders(sessionId);
  const itemMap = new Map<string, { name: string; quantity: number; unit_price: number; total: number }>();

  orders.forEach((order) => {
    if (order.status === 'cancelled') return;

    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const existing = itemMap.get(item.name);
      const itemTotal = item.total_price || (item.unit_price * item.quantity);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += itemTotal;
      } else {
        itemMap.set(item.name, {
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: itemTotal
        });
      }
    });
  });

  const items_summary = Array.from(itemMap.values());
  const total_amount = items_summary.reduce((acc, item) => acc + item.total, 0);

  return {
    orders,
    items_summary,
    total_amount: Number(total_amount.toFixed(2))
  };
}

/**
 * Solicitação de Fechamento de Conta (Pix ou Maquineta)
 */
export async function requestBill(
  sessionId: string, 
  paymentMethod: PaymentMethod
): Promise<{ billRequest: BillRequest; totalAmount: number } | null> {
  if (!supabase) return null;

  const { total_amount } = await getSessionSummary(sessionId);

  // Registra a solicitação na tabela bill_requests
  const { data: billReq, error: billErr } = await supabase
    .from('bill_requests')
    .insert({
      session_id: sessionId,
      total_amount,
      payment_method: paymentMethod,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (billErr || !billReq) {
    console.error('Erro ao registrar solicitação de conta:', billErr);
    return null;
  }

  // Atualiza status da sessão para 'bill_requested'
  await supabase
    .from('table_sessions')
    .update({ status: 'bill_requested' })
    .eq('id', sessionId);

  return {
    billRequest: billReq as BillRequest,
    totalAmount: total_amount
  };
}

/**
 * Confirma pagamento de uma conta pelo caixa (Pix ou Cartão) e libera a mesa
 */
export async function confirmBillAndCloseSession(
  sessionId: string, 
  billRequestId?: string
): Promise<boolean> {
  if (!supabase) return false;

  const now = new Date().toISOString();

  // 1. Atualiza bill_request se houver
  if (billRequestId) {
    await supabase
      .from('bill_requests')
      .update({ status: 'confirmed', confirmed_at: now })
      .eq('id', billRequestId);
  } else {
    // Confirma qualquer bill_request pendente daquela sessão
    await supabase
      .from('bill_requests')
      .update({ status: 'confirmed', confirmed_at: now })
      .eq('session_id', sessionId)
      .eq('status', 'pending');
  }

  // 2. Atualiza a sessão da mesa para 'closed'
  const { error: sessionErr } = await supabase
    .from('table_sessions')
    .update({ 
      status: 'closed', 
      closed_at: now 
    })
    .eq('id', sessionId);

  return !sessionErr;
}

/**
 * Lista todas as mesas ativas ou recentes do estabelecimento para o Painel de Gestão e Caixa
 */
export async function listActiveTablesWithDetails(establishmentId: string): Promise<TableSessionWithOrders[]> {
  if (!supabase) return [];

  // Busca sessões ativas (open e bill_requested) ou recém finalizadas nas últimas 12 horas
  const { data: sessions, error: sessErr } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('establishment_id', establishmentId)
    .in('status', ['open', 'bill_requested', 'paid', 'closed'])
    .order('opened_at', { ascending: false })
    .limit(40);

  if (sessErr || !sessions) return [];

  const results: TableSessionWithOrders[] = [];

  for (const session of sessions) {
    const summary = await getSessionSummary(session.id);

    // Busca bill_request associado
    const { data: billReq } = await supabase
      .from('bill_requests')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    results.push({
      ...(session as TableSession),
      orders: summary.orders,
      items_summary: summary.items_summary,
      total_consumed: summary.total_amount,
      bill_request: (billReq as BillRequest) || null
    });
  }

  return results;
}

/**
 * Lista pedidos para a tela KDS / Cozinha com informações da mesa
 */
export async function listKitchenOrdersWithSession(establishmentId: string): Promise<(Order & { session_status: TableSession['status'] })[]> {
  if (!supabase) return [];

  // Busca pedidos ativos (received, preparing, ready)
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      table_sessions:session_id (
        status
      )
    `)
    .eq('establishment_id', establishmentId)
    .in('status', ['received', 'preparing', 'ready'])
    .order('created_at', { ascending: true });

  if (error || !orders) return [];

  return orders.map((o: any) => ({
    ...o,
    session_status: o.table_sessions?.status || 'open'
  }));
}
