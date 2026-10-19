import { NextRequest, NextResponse } from 'next/server';
import { 
  getEstablishment, 
  getOrCreateActiveSession, 
  getMenuItems, 
  getSessionSummary, 
  createOrder, 
  requestBill 
} from '@/lib/services/garcom-service';
import { generatePixCopyPaste } from '@/lib/services/pix-service';
import { OrderItem } from '@/lib/types/garcom';

interface ChatRequestBody {
  establishment: string; // slug ou ID
  table: string;         // Número da mesa (ex: "4", "12")
  message: string;       // Mensagem enviada pelo cliente
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { establishment: establishmentIdentifier, table, message, history = [] } = body;

    if (!establishmentIdentifier || !table || !message) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: establishment, table e message.' },
        { status: 400 }
      );
    }

    // 1. Identificar o estabelecimento
    const establishment = await getEstablishment(establishmentIdentifier);
    if (!establishment) {
      return NextResponse.json(
        { error: `Estabelecimento "${establishmentIdentifier}" não encontrado.` },
        { status: 404 }
      );
    }

    // 2. Obter ou criar a sessão ativa da mesa (Entrada Zero Atrito)
    const session = await getOrCreateActiveSession(establishment.id, table);
    if (!session) {
      return NextResponse.json(
        { error: 'Não foi possível inicializar ou localizar a sessão da mesa.' },
        { status: 500 }
      );
    }

    // 3. Obter itens do cardápio e extrato atual de consumo da mesa
    const menuItems = await getMenuItems(establishment.id, true);
    const summary = await getSessionSummary(session.id);

    // 4. Detecção de Intenções (Heurísticas Inteligentes + Gemini AI)
    const lowerMsg = message.toLowerCase().trim();

    // A) INTENÇÃO: CONSULTA PARCIAL DA CONTA
    const isPartialBillInquiry = 
      /parcial|conta|extrato|quanto\s+t[aá]|gasto|saldo|pedidos\s+da\s+mesa|o\s+que\s+pedi/i.test(lowerMsg) &&
      !/fechar|fechamento|encerrar|pagar|feche|fecha|passar\s+a\s+regua/i.test(lowerMsg);

    if (isPartialBillInquiry) {
      if (summary.items_summary.length === 0) {
        return NextResponse.json({
          response: `🍽️ **Mesa ${session.table_number}**\n\nNenhum item foi pedido nesta mesa até o momento.\nO que você gostaria de pedir hoje? Posso te sugerir alguns dos nossos pratos ou bebidas!`,
          action_type: 'bill_preview',
          metadata: {
            total: 0,
            items: []
          }
        });
      }

      const itemsList = summary.items_summary
        .map((item) => `• **${item.quantity}x** ${item.name} — R$ ${item.total.toFixed(2)} (R$ ${item.unit_price.toFixed(2)} un)`)
        .join('\n');

      const responseText = `🧾 **Extrato Parcial da Mesa ${session.table_number}**\n\n${itemsList}\n\n💰 **Subtotal Parcial:** R$ ${summary.total_amount.toFixed(2)}\n\n_Quando quiser encerrar a mesa, basta me avisar: "Quero fechar a conta"!_`;

      return NextResponse.json({
        response: responseText,
        action_type: 'bill_preview',
        metadata: {
          total: summary.total_amount,
          items: summary.items_summary
        }
      });
    }

    // B) INTENÇÃO: ESCOLHA DIRETA DE PAGAMENTO VIA PIX
    const isPayPixChoice = 
      (/pix/i.test(lowerMsg) && /pagar|fechar|quero|chave|1|opção 1|opcao 1|manda/i.test(lowerMsg)) ||
      (lowerMsg === '1' || lowerMsg === 'pix');

    if (isPayPixChoice) {
      if (summary.total_amount <= 0) {
        return NextResponse.json({
          response: `🍽️ A Mesa ${session.table_number} ainda não possui pedidos em aberto para fechar conta no Pix.`,
          action_type: 'bill_preview'
        });
      }

      // Registra solicitação no banco e atualiza status para 'bill_requested'
      await requestBill(session.id, 'pix');

      const pixKey = establishment.pix_key || '12345678000190';
      const beneficiary = establishment.pix_beneficiary_name || establishment.name;
      const keyType = establishment.pix_key_type || 'Chave Pix';

      const copyPasteCode = generatePixCopyPaste({
        pixKey,
        beneficiaryName: beneficiary,
        amount: summary.total_amount,
        txid: `MESA${session.table_number}`
      });

      const responseText = `⚡ **Fechamento via Pix — Mesa ${session.table_number}**\n\n` +
        `💵 **Total da Conta:** **R$ ${summary.total_amount.toFixed(2)}**\n` +
        `👤 **Favorecido:** ${beneficiary}\n` +
        `🔑 **Chave Pix (${keyType.toUpperCase()}):** \`${pixKey}\`\n\n` +
        (copyPasteCode ? `📋 **Código Pix Copia-e-Cola:**\n\`${copyPasteCode}\`\n\n` : '') +
        `👉 Abra o app do seu banco, faça o Pix e a confirmação será feita automaticamente pelo caixa. Obrigado pela preferência!`;

      return NextResponse.json({
        response: responseText,
        action_type: 'bill_requested_pix',
        metadata: {
          total: summary.total_amount,
          pix_key: pixKey,
          pix_key_type: keyType,
          pix_beneficiary: beneficiary,
          pix_copy_paste: copyPasteCode
        }
      });
    }

    // C) INTENÇÃO: ESCOLHA DE PAGAMENTO VIA CARTÃO / CHAMAR GARÇOM COM MAQUINETA
    const isPayCardChoice = 
      (/cart[aã]o|maquineta|maquininha|gar[cç]om|2|opção 2|opcao 2/i.test(lowerMsg) &&
       /pagar|fechar|chama|trazer|cr[eé]dito|d[eé]bito|maquin/i.test(lowerMsg)) ||
      (lowerMsg === '2' || lowerMsg === 'cartao' || lowerMsg === 'cartão');

    if (isPayCardChoice) {
      if (summary.total_amount <= 0) {
        return NextResponse.json({
          response: `🍽️ A Mesa ${session.table_number} ainda não possui pedidos em aberto para pagamento.`,
          action_type: 'bill_preview'
        });
      }

      // Registra solicitação no banco com método 'card_machine' e status 'bill_requested'
      await requestBill(session.id, 'card_machine');

      const responseText = `🛎️ **Garçom Acionado para a Mesa ${session.table_number}!**\n\n` +
        `💵 **Total Consolidado:** **R$ ${summary.total_amount.toFixed(2)}**\n\n` +
        `O garçom já recebeu o chamado no painel do salão e está se dirigindo à sua mesa com a **maquineta de cartão** (Crédito, Débito e Refeição).\n` +
        `Por favor, aguarde alguns instantes!`;

      return NextResponse.json({
        response: responseText,
        action_type: 'bill_requested_card',
        metadata: {
          total: summary.total_amount,
          payment_method: 'card_machine'
        }
      });
    }

    // D) INTENÇÃO: FECHAR A CONTA (EXIBIR EXTRATO FINAL E OFERECER OPÇÕES DE PAGAMENTO)
    const isCloseBillRequest = /fechar|fecha|fechamento|encerrar|pedir\s+a\s+conta|trazer\s+a\s+conta|passar\s+a\s+r[eé]gua|a\s+conta\s+por\s+favor/i.test(lowerMsg);

    if (isCloseBillRequest) {
      if (summary.items_summary.length === 0) {
        return NextResponse.json({
          response: `🍽️ **Mesa ${session.table_number}**\n\nVocê ainda não possui pedidos registrados nesta mesa. Caso deseje pedir algo do cardápio, estou à disposição!`,
          action_type: 'bill_preview'
        });
      }

      const itemsList = summary.items_summary
        .map((item) => `• **${item.quantity}x** ${item.name} — R$ ${item.total.toFixed(2)}`)
        .join('\n');

      const responseText = `🧾 **Fechamento de Conta — Mesa ${session.table_number}**\n\n` +
        `**Extrato Consolidado:**\n${itemsList}\n\n` +
        `💰 **TOTAL FINAL:** **R$ ${summary.total_amount.toFixed(2)}**\n\n` +
        `Como prefere realizar o pagamento?\n\n` +
        `1️⃣ **Pagar com Pix** (Receba a chave Pix e Copia-e-Cola agora no chat)\n` +
        `2️⃣ **Pagar no Cartão** (Chamar garçom com a maquininha na mesa)\n\n` +
        `_Responda com **"1"** para Pix ou **"2"** para Cartão._`;

      return NextResponse.json({
        response: responseText,
        action_type: 'bill_preview',
        metadata: {
          total: summary.total_amount,
          items: summary.items_summary
        }
      });
    }

    // E) INTENÇÃO: FAZER UM PEDIDO OU CONSULTAR O CARDÁPIO
    // Tenta identificar itens do cardápio solicitados pelo cliente
    const detectedOrderItems: OrderItem[] = [];
    menuItems.forEach((menuItem) => {
      const escapedName = menuItem.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const itemRegex = new RegExp(`(\\d+)?\\s*(?:x|de)?\\s*${escapedName}`, 'i');
      const match = lowerMsg.match(itemRegex);

      if (match) {
        // Verifica se há verbo de intenção de pedido
        const hasOrderVerb = /quero|pedir|traz|manda|desejo|por\s+favor|vou\s+querer|me\s+v[eê]|adiciona/i.test(lowerMsg) || match[1];
        if (hasOrderVerb) {
          const qty = match[1] ? parseInt(match[1], 10) : 1;
          detectedOrderItems.push({
            menu_item_id: menuItem.id,
            name: menuItem.name,
            quantity: qty,
            unit_price: menuItem.price,
            total_price: Number((menuItem.price * qty).toFixed(2))
          });
        }
      }
    });

    if (detectedOrderItems.length > 0) {
      // Registra o pedido no banco e envia para o KDS
      const newOrder = await createOrder({
        establishment_id: establishment.id,
        session_id: session.id,
        table_number: session.table_number,
        items: detectedOrderItems
      });

      const itemsText = detectedOrderItems
        .map((i) => `• **${i.quantity}x** ${i.name} (R$ ${i.total_price.toFixed(2)})`)
        .join('\n');

      const totalOrder = detectedOrderItems.reduce((acc, i) => acc + i.total_price, 0);

      const responseText = `✅ **Pedido Confirmado e Enviado para a Cozinha!**\n\n` +
        `${itemsText}\n\n` +
        `💵 **Total do pedido:** R$ ${totalOrder.toFixed(2)}\n` +
        `⏱️ Seus itens já estão sendo preparados com todo carinho. Precisa de mais alguma coisa?`;

      return NextResponse.json({
        response: responseText,
        action_type: 'order_confirmed',
        metadata: {
          order_id: newOrder?.id,
          order_items: detectedOrderItems
        }
      });
    }

    // F) RESPOSTA VIA GEMINI AI (COM CARDÁPIO E CONTEXTO COMPLETO)
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_API_KEY ||
      '';

    if (apiKey) {
      const menuContext = menuItems
        .map((m) => `- [${m.category}] ${m.name}: R$ ${m.price.toFixed(2)} - ${m.description || ''}`)
        .join('\n');

      const sessionContext = summary.items_summary.length > 0
        ? summary.items_summary.map((i) => `${i.quantity}x ${i.name} (R$ ${i.total.toFixed(2)})`).join(', ')
        : 'Nenhum pedido realizado ainda';

      const systemPrompt = `
Você é o garçom inteligente e atencioso do restaurante "${establishment.name}", atendendo os clientes da Mesa ${session.table_number}.
Seu objetivo é proporcionar um atendimento impecável, acolhedor, rápido e sem nenhum atrito.

DADOS DA MESA:
- Mesa: ${session.table_number}
- Status da Sessão: ${session.status}
- Consumo Atual da Mesa: ${sessionContext} (Total: R$ ${summary.total_amount.toFixed(2)})

CARDÁPIO DISPONÍVEL:
${menuContext}

DIRETRIZES DE ATENDIMENTO:
1. Seja sempre educado, prestativo e simpático em português do Brasil.
2. Se o cliente perguntar sobre opções, recomende pratos e bebidas do cardápio acima com os respectivos preços em reais.
3. Se o cliente quiser consultar a conta parcial, explique o que já foi consumido e o subtotal.
4. Se o cliente pedir a conta ou falar de encerramento, apresente o extrato e ofereça as 2 opções:
   - Opção 1: Pagar com Pix (mais rápido e prático)
   - Opção 2: Pagar no Cartão (chamar o garçom com a maquininha)
5. Não invente pratos que não estejam no cardápio listado.
6. Mantenha as respostas concisas e bem formatadas com emojis moderados.
`.trim();

      const messagesPayload = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nCliente disse: "${message}"` }]
        }
      ];

      // Chamada resiliente para o Google Gemini
      const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: messagesPayload,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 600
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return NextResponse.json({
                response: text.trim(),
                action_type: 'menu_display'
              });
            }
          }
        } catch (err) {
          console.warn(`Tentativa com ${model} falhou:`, err);
        }
      }
    }

    // FALLBACK HEURÍSTICO CASO GEMINI OFFLINE
    const categories = Array.from(new Set(menuItems.map((m) => m.category)));
    const menuSummary = categories
      .map((cat) => {
        const items = menuItems.filter((m) => m.category === cat);
        return `**${cat}:**\n` + items.map((i) => `• ${i.name} — R$ ${i.price.toFixed(2)}`).join('\n');
      })
      .join('\n\n');

    return NextResponse.json({
      response: `Olá! Sou o assistente da **Mesa ${session.table_number}** no **${establishment.name}**.\n\n` +
        `Confira nosso cardápio de hoje:\n\n${menuSummary}\n\n` +
        `Você pode me pedir um item diretamente (ex: *"Quero 1 Burger Artesanal"*), perguntar *"Quanto tá a conta?"* ou dizer *"Quero fechar a conta"* a qualquer momento!`,
      action_type: 'menu_display'
    });

  } catch (error: any) {
    console.error('Erro na rota de chatbot:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar atendimento.', details: error?.message },
      { status: 500 }
    );
  }
}
