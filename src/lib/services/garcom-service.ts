import { supabase } from '@/lib/supabase/client';
import { 
  Establishment, 
  TableSession, 
  Order, 
  OrderItem, 
  BillRequest, 
  MenuItem, 
  TableSessionWithOrders, 
  PaymentMethod,
  SharedOrderItem,
  SafetyAlert,
  ClientAgeConsent
} from '@/lib/types/garcom';

/**
 * Busca dados do estabelecimento por slug ou id
 */
export async function getEstablishment(identifier: string): Promise<Establishment | null> {
  if (!supabase) return null;

  const { data: bySlug } = await supabase
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
 * Atualiza configurações de recebimento Pix e limite de comanda do estabelecimento
 */
export async function updateEstablishmentPix(
  establishmentId: string, 
  pixData: { pix_key: string; pix_key_type: string; pix_beneficiary_name: string; max_tab_limit?: number }
): Promise<boolean> {
  if (!supabase) return false;

  const updatePayload: any = {
    pix_key: pixData.pix_key.trim(),
    pix_key_type: pixData.pix_key_type,
    pix_beneficiary_name: pixData.pix_beneficiary_name.trim(),
    updated_at: new Date().toISOString()
  };

  if (typeof pixData.max_tab_limit === 'number') {
    updatePayload.max_tab_limit = pixData.max_tab_limit;
  }

  const { error } = await supabase
    .from('establishments')
    .update(updatePayload)
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
 * Consulta de Consentimento Legal +18 por Telefone do Cliente
 */
export async function getClientAgeConsent(phone: string): Promise<ClientAgeConsent | null> {
  if (!supabase || !phone) return null;

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const { data } = await supabase
    .from('client_age_consents')
    .select('*')
    .eq('client_phone', cleanPhone)
    .maybeSingle();

  return (data as ClientAgeConsent) || null;
}

/**
 * Registra Consentimento Legal +18
 */
export async function saveClientAgeConsent(phone: string, isAdult: boolean): Promise<boolean> {
  if (!supabase || !phone) return false;

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const { error } = await supabase
    .from('client_age_consents')
    .upsert({
      client_phone: cleanPhone,
      is_adult: isAdult,
      consent_at: new Date().toISOString()
    });

  return !error;
}

/**
 * Obtém a sessão ativa de uma mesa ou cria uma nova com status 'open' (Zero Atrito)
 */
export async function getOrCreateActiveSession(
  establishmentId: string, 
  tableNumber: string, 
  clientPhone?: string
): Promise<TableSession | null> {
  if (!supabase) return null;

  const cleanTableNumber = tableNumber.replace(/[^0-9a-zA-Z\s]/g, '').trim();

  // Busca sessão aberta ou com conta solicitada
  const { data: existing } = await supabase
    .from('table_sessions')
    .select('*')
    .eq('establishment_id', establishmentId)
    .eq('table_number', cleanTableNumber)
    .in('status', ['open', 'bill_requested'])
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    if (clientPhone && !existing.client_phone) {
      await supabase
        .from('table_sessions')
        .update({ client_phone: clientPhone })
        .eq('id', existing.id);
    }
    return existing as TableSession;
  }

  // Cria uma nova sessão aberta
  const { data: created, error: createErr } = await supabase
    .from('table_sessions')
    .insert({
      establishment_id: establishmentId,
      table_number: cleanTableNumber,
      client_phone: clientPhone || null,
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
 * Atualiza número da mesa da sessão se o cliente mudou de mesa
 */
export async function updateSessionTableNumber(sessionId: string, newTableNumber: string): Promise<boolean> {
  if (!supabase) return false;

  const cleanTableNumber = newTableNumber.replace(/[^0-9a-zA-Z\s]/g, '').trim();
  const { error } = await supabase
    .from('table_sessions')
    .update({ table_number: cleanTableNumber })
    .eq('id', sessionId);

  return !error;
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
 * Registra Item Compartilhado para Rateio
 */
export async function createSharedOrderItem(params: {
  sessionId: string;
  itemName: string;
  totalPrice: number;
  primaryPhone: string;
  invitedPhone: string;
  splitRatio?: number;
}): Promise<SharedOrderItem | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('shared_order_items')
    .insert({
      session_id: params.sessionId,
      item_name: params.itemName,
      total_price: params.totalPrice,
      primary_client_phone: params.primaryPhone,
      invited_client_phone: params.invitedPhone,
      split_ratio: params.splitRatio || 0.50,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !data) return null;
  return data as SharedOrderItem;
}

/**
 * Responde a solicitação de divisão de item (Aceitar ou Recusar)
 */
export async function respondSharedOrderItem(
  sharedId: string, 
  status: 'accepted' | 'rejected'
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('shared_order_items')
    .update({
      status,
      responded_at: new Date().toISOString()
    })
    .eq('id', sharedId);

  return !error;
}

/**
 * Lista itens compartilhados de uma sessão
 */
export async function listSessionSharedItems(sessionId: string): Promise<SharedOrderItem[]> {
  if (!supabase) return [];

  const { data } = await supabase
    .from('shared_order_items')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  return (data as SharedOrderItem[]) || [];
}

/**
 * Registra Alerta de Segurança Discreta (Protocolo Não é Não)
 */
export async function createSafetyAlert(
  establishmentId: string, 
  tableNumber: string, 
  clientPhone?: string,
  notes?: string
): Promise<SafetyAlert | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('safety_alerts')
    .insert({
      establishment_id: establishmentId,
      table_number: tableNumber,
      client_phone: clientPhone || null,
      notes: notes || 'Solicitação de apoio discreto via chat',
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao registrar alerta de segurança:', error);
    return null;
  }

  return data as SafetyAlert;
}

/**
 * Lista alertas de segurança pendentes
 */
export async function listPendingSafetyAlerts(establishmentId: string): Promise<SafetyAlert[]> {
  if (!supabase) return [];

  const { data } = await supabase
    .from('safety_alerts')
    .select('*')
    .eq('establishment_id', establishmentId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (data as SafetyAlert[]) || [];
}

/**
 * Atualiza status do alerta de segurança
 */
export async function updateSafetyAlertStatus(alertId: string, status: 'attended' | 'dismissed'): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('safety_alerts')
    .update({
      status,
      attended_at: new Date().toISOString()
    })
    .eq('id', alertId);

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

  if (billRequestId) {
    await supabase
      .from('bill_requests')
      .update({ status: 'confirmed', confirmed_at: now })
      .eq('id', billRequestId);
  } else {
    await supabase
      .from('bill_requests')
      .update({ status: 'confirmed', confirmed_at: now })
      .eq('session_id', sessionId)
      .eq('status', 'pending');
  }

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
 * Lista todas as mesas com detalhes de consumo, limites e itens divididos
 */
export async function listActiveTablesWithDetails(establishmentId: string): Promise<TableSessionWithOrders[]> {
  if (!supabase) return [];

  const establishment = await getEstablishment(establishmentId);
  const maxLimit = establishment?.max_tab_limit || 250.00;

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
    const sharedItems = await listSessionSharedItems(session.id);

    const { data: billReq } = await supabase
      .from('bill_requests')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isNearLimit = summary.total_amount >= (maxLimit * 0.80);

    results.push({
      ...(session as TableSession),
      orders: summary.orders,
      items_summary: summary.items_summary,
      total_consumed: summary.total_amount,
      bill_request: (billReq as BillRequest) || null,
      shared_items: sharedItems,
      is_near_tab_limit: isNearLimit
    });
  }

  return results;
}

/**
 * Lista pedidos para a tela KDS / Cozinha com informações da mesa
 */
export async function listKitchenOrdersWithSession(establishmentId: string): Promise<(Order & { session_status: TableSession['status'] })[]> {
  if (!supabase) return [];

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
