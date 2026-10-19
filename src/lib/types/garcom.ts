/**
-- ==============================================================================
-- TIPAGEM TYPE-SAFE DO VURIO GARÇOM
-- Modelagem de Atendimento Autônomo, Gestão de Mesas, KDS e Fechamento de Conta
-- ==============================================================================
 */

export type PixKeyType = 'cnpj' | 'cpf' | 'email' | 'phone' | 'random';

export interface Establishment {
  id: string;
  name: string;
  slug: string;
  pix_key?: string | null;
  pix_key_type?: PixKeyType | null;
  pix_beneficiary_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type TableSessionStatus = 'open' | 'bill_requested' | 'paid' | 'closed';

export interface TableSession {
  id: string;
  establishment_id: string;
  table_number: string;
  status: TableSessionStatus;
  opened_at: string;
  closed_at?: string | null;
}

export interface OrderItem {
  id?: string;
  menu_item_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  establishment_id: string;
  session_id: string;
  table_number: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export type PaymentMethod = 'pix' | 'card_machine' | 'cash';
export type BillRequestStatus = 'pending' | 'confirmed' | 'cancelled';

export interface BillRequest {
  id: string;
  session_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  status: BillRequestStatus;
  created_at: string;
  confirmed_at?: string | null;
}

export interface MenuItem {
  id: string;
  establishment_id: string;
  name: string;
  description?: string | null;
  price: number;
  category: string;
  is_available: boolean;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TableSessionWithOrders extends TableSession {
  orders: Order[];
  bill_request?: BillRequest | null;
  total_consumed: number;
  items_summary: {
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action_type?: 'menu_display' | 'bill_preview' | 'bill_requested_pix' | 'bill_requested_card' | 'order_confirmed';
  metadata?: {
    total?: number;
    pix_key?: string;
    pix_key_type?: string;
    pix_beneficiary?: string;
    pix_copy_paste?: string;
    order_items?: OrderItem[];
  };
}
