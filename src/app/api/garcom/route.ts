import { NextRequest, NextResponse } from 'next/server';
import { 
  getEstablishment, 
  updateEstablishmentPix, 
  listActiveTablesWithDetails, 
  confirmBillAndCloseSession, 
  listKitchenOrdersWithSession, 
  updateOrderStatus, 
  getMenuItems, 
  upsertMenuItem, 
  toggleMenuItemAvailability 
} from '@/lib/services/garcom-service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'tables';
    const establishmentIdentifier = searchParams.get('establishment') || 'exemplo';

    const establishment = await getEstablishment(establishmentIdentifier);
    if (!establishment) {
      return NextResponse.json({ error: 'Estabelecimento não encontrado' }, { status: 404 });
    }

    if (action === 'tables') {
      const tables = await listActiveTablesWithDetails(establishment.id);
      return NextResponse.json({ establishment, tables });
    }

    if (action === 'kitchen') {
      const orders = await listKitchenOrdersWithSession(establishment.id);
      return NextResponse.json({ establishment, orders });
    }

    if (action === 'menu') {
      const menu = await getMenuItems(establishment.id, false);
      return NextResponse.json({ establishment, menu });
    }

    return NextResponse.json({ establishment });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, establishmentId } = body;

    if (!establishmentId) {
      return NextResponse.json({ error: 'establishmentId obrigatório' }, { status: 400 });
    }

    // 1. Atualizar Chave Pix do Dono
    if (action === 'update_pix') {
      const { pix_key, pix_key_type, pix_beneficiary_name } = body;
      const success = await updateEstablishmentPix(establishmentId, {
        pix_key,
        pix_key_type,
        pix_beneficiary_name
      });
      return NextResponse.json({ success });
    }

    // 2. Confirmar Pagamento e Baixar/Liberar Mesa
    if (action === 'confirm_bill') {
      const { sessionId, billRequestId } = body;
      if (!sessionId) {
        return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 });
      }
      const success = await confirmBillAndCloseSession(sessionId, billRequestId);
      return NextResponse.json({ success });
    }

    // 3. Atualizar Status do Pedido no KDS
    if (action === 'update_order_status') {
      const { orderId, status } = body;
      if (!orderId || !status) {
        return NextResponse.json({ error: 'orderId e status obrigatórios' }, { status: 400 });
      }
      const success = await updateOrderStatus(orderId, status);
      return NextResponse.json({ success });
    }

    // 4. Salvar item de cardápio
    if (action === 'save_menu_item') {
      const { item } = body;
      const saved = await upsertMenuItem({
        ...item,
        establishment_id: establishmentId
      });
      return NextResponse.json({ success: Boolean(saved), item: saved });
    }

    // 5. Alternar disponibilidade
    if (action === 'toggle_menu_item') {
      const { itemId, isAvailable } = body;
      const success = await toggleMenuItemAvailability(itemId, isAvailable);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
