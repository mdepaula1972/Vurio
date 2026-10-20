/**
-- ==============================================================================
-- TIPAGEM TYPE-SAFE DO VURIO GARÇOM
-- Modelagem de Atendimento Autônomo, Gestão de Mesas, KDS, Fechamento de Conta,
-- Rateio com Confirmação e Protocolo de Segurança Discreta
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
  max_tab_limit?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type TableSessionStatus = 'open' | 'bill_requested' | 'paid' | 'closed';

export interface TableSession {
  id: string;
  establishment_id: string;
  table_number: string;
  status: TableSessionStatus;
  client_phone?: string | null;
  verified_adult?: boolean | null;
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
  is_alcoholic?: boolean;
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

export type SharedItemStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface SharedOrderItem {
  id: string;
  session_id: string;
  item_name: string;
  total_price: number;
  primary_client_phone: string;
  invited_client_phone: string;
  split_ratio: number;
  status: SharedItemStatus;
  created_at: string;
  responded_at?: string | null;
}

export type SafetyAlertStatus = 'pending' | 'attended' | 'dismissed';

export interface SafetyAlert {
  id: string;
  establishment_id: string;
  table_number: string;
  client_phone?: string | null;
  notes?: string | null;
  status: SafetyAlertStatus;
  created_at: string;
  attended_at?: string | null;
}

export interface ClientAgeConsent {
  id: string;
  client_phone: string;
  is_adult: boolean;
  consent_at: string;
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
  shared_items?: SharedOrderItem[];
  is_near_tab_limit?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  action_type?: 
    | 'menu_display' 
    | 'bill_preview' 
    | 'bill_requested_pix' 
    | 'bill_requested_card' 
    | 'order_confirmed'
    | 'age_verification_required'
    | 'table_confirmation_required'
    | 'split_requested'
    | 'split_rejected_options'
    | 'tab_limit_warning'
    | 'safety_alert_triggered';
  metadata?: {
    total?: number;
    pix_key?: string;
    pix_key_type?: string;
    pix_beneficiary?: string;
    pix_copy_paste?: string;
    order_items?: OrderItem[];
    tab_limit?: number;
    current_tab?: number;
    table_confirmed?: string;
    split_id?: string;
    split_item?: string;
  };
}
