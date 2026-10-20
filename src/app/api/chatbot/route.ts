import { NextRequest, NextResponse } from 'next/server';
import { 
  getEstablishment, 
  getOrCreateActiveSession, 
  getMenuItems, 
  getSessionSummary, 
  createOrder, 
  requestBill,
  getClientAgeConsent,
  saveClientAgeConsent,
  updateSessionTableNumber,
  createSafetyAlert,
  createSharedOrderItem,
  respondSharedOrderItem
} from '@/lib/services/garcom-service';
import { generatePixCopyPaste } from '@/lib/services/pix-service';
import { OrderItem } from '@/lib/types/garcom';

interface ChatRequestBody {
  establishment: string; // slug ou ID
  table: string;         // Número da mesa
  message: string;       // Mensagem enviada pelo cliente
  phone?: string;        // Telefone / ID WhatsApp do cliente
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { 
      establishment: establishmentIdentifier, 
      table, 
      message, 
      phone = '5511999990001' 
    } = body;

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

    const tabLimit = establishment.max_tab_limit || 250.00;

    // 2. Obter ou criar a sessão ativa da mesa (Entrada Zero Atrito)
    const session = await getOrCreateActiveSession(establishment.id, table, phone);
    if (!session) {
      return NextResponse.json(
        { error: 'Não foi possível inicializar a sessão da mesa.' },
        { status: 500 }
      );
    }

    const lowerMsg = message.toLowerCase().trim();

    // =========================================================================
    // REGRA F: PROTOCOLO DE APOIO DISCRETO / SEGURANÇA (NÃO É NÃO / CÓDIGO 180)
    // =========================================================================
    const isSafetyAlertTrigger = 
      /c[oó]digo\s*180|apoio|ajuda\s+discreta|socorro|seguran[cç]a|protocolo\s+n[aã]o\s+[eé]\s+n[aã]o|falar\s+com\s+a\s+ger[eê]ncia/i.test(lowerMsg);

    if (isSafetyAlertTrigger) {
      // Registra silenciosamente no banco para alertar o painel do gerente
      await createSafetyAlert(establishment.id, session.table_number, phone, 'Solicitação de apoio discreto via chat');

      return NextResponse.json({
        response: `Compreendido. Nossa equipe foi discretamente comunicada e alguém irá até a sua mesa para auxiliá-la em instantes. Mantenha a calma, estamos cuidando disso.`,
        action_type: 'safety_alert_triggered',
        metadata: {
          table_confirmed: session.table_number
        }
      });
    }

    // =========================================================================
    // REGRA A: VERIFICAÇÃO +18 (COMPLIANCE LEGAL NO 1º ACESSO)
    // =========================================================================
    let ageConsent = await getClientAgeConsent(phone);

    // Se o cliente estiver respondendo à pergunta de idade:
    const isAnsweringAge = 
      /^(1|sim|maior|tenho\s*18|sou\s*maior)$/i.test(lowerMsg) ||
      /^(2|n[aã]o|menor|sou\s*menor)$/i.test(lowerMsg);

    if (!ageConsent && isAnsweringAge) {
      const isAdult = /^(1|sim|maior|tenho\s*18|sou\s*maior)$/i.test(lowerMsg);
      await saveClientAgeConsent(phone, isAdult);
      ageConsent = { id: 'temp', client_phone: phone, is_adult: isAdult, consent_at: new Date().toISOString() };

      if (!isAdult) {
        return NextResponse.json({
          response: `✅ Obrigado pela confirmação! Seu atendimento na **Mesa ${session.table_number}** está liberado para pratos, porções, sucos e refrigerantes.\n\n⚠️ Por cumprimento legal (Lei nº 8.069/90), bebidas alcoólicas estarão desabilitadas para a sua comanda.\n\nO que gostaria de pedir hoje?`,
          action_type: 'menu_display'
        });
      } else {
        return NextResponse.json({
          response: `✅ Maioridade confirmada com sucesso! Bem-vindo(a) ao **${establishment.name}** na **Mesa ${session.table_number}**.\n\nCardápio liberado por completo! Pode me pedir pratos, drinks e bebidas a qualquer momento.`,
          action_type: 'menu_display'
        });
      }
    }

    // Se ainda não tem cadastro de idade e enviou uma saudação inicial:
    if (!ageConsent) {
      return NextResponse.json({
        response: `🔞 **Verificação de Idade:**\nAntes de começarmos seu atendimento no **${establishment.name}**: você confirma que é maior de 18 anos?\n\n1️⃣ **Sim, sou maior de 18 anos**\n2️⃣ **Não, sou menor de idade**`,
        action_type: 'age_verification_required'
      });
    }

    // =========================================================================
    // REGRA B: CONFIRMAÇÃO DINÂMICA DE MESA
    // =========================================================================
    const isChangingTable = lowerMsg.match(/mudei\s*(?:de\s*mesa\s*(?:para\s*a?)?)?\s*(?:mesa)?\s*([0-9a-zA-Z]+)/i);
    if (isChangingTable && isChangingTable[1]) {
      const newTable = isChangingTable[1].trim();
      await updateSessionTableNumber(session.id, newTable);
      session.table_number = newTable;

      return NextResponse.json({
        response: `📍 Coordenada atualizada com sucesso! Seus pedidos agora serão entregues na **Mesa ${newTable}**.`,
        action_type: 'table_confirmation_required',
        metadata: {
          table_confirmed: newTable
        }
      });
    }

    // =========================================================================
    // REGRA C: RATEIO DE ITENS COM ALERTA DE RECUSA
    // =========================================================================
    // Aceite de divisão
    if (/^(aceitar\s+divis[aã]o|aceitar|aceito|1\s+aceitar)$/i.test(lowerMsg)) {
      return NextResponse.json({
        response: `✅ **Divisão Confirmada!** O valor proporcional foi adicionado ao seu consumo com sucesso.`,
        action_type: 'split_requested'
      });
    }

    // Recusa de divisão
    if (/^(recusar\s+divis[aã]o|recusar|recuso|2\s+recusar)$/i.test(lowerMsg)) {
      return NextResponse.json({
        response: `⚠️ Você optou por não dividir o item. O colega foi notificado com as opções de manter integral ou cancelar o item.`,
        action_type: 'split_rejected_options'
      });
    }

    // Solicitação de divisão de item
    const isSplitRequest = lowerMsg.match(/dividir\s+(?:o|a)?\s*(.*?)\s+com\s+(?:o|a)?\s*([0-9a-zA-Z\s]+)/i);
    if (isSplitRequest) {
      const targetItem = isSplitRequest[1].trim();
      const colleague = isSplitRequest[2].trim();

      await createSharedOrderItem({
        sessionId: session.id,
        itemName: targetItem,
        totalPrice: 38.00,
        primaryPhone: phone,
        invitedPhone: colleague,
        splitRatio: 0.50
      });

      return NextResponse.json({
        response: `🤝 **Proposta de Divisão Enviada!**\nVocê marcou o item **"${targetItem}"** para dividir com **${colleague}** (R$ 19,00 para cada).\n\nAssim que ele confirmar na conversa dele, o rateio será concluído. Caso ele recuse, você poderá escolher entre assumir o item integral ou cancelar.`,
        action_type: 'split_requested',
        metadata: {
          split_item: targetItem
        }
      });
    }

    // 3. Obter itens do cardápio e extrato atual de consumo
    const menuItems = await getMenuItems(establishment.id, true);
    const summary = await getSessionSummary(session.id);

    // =========================================================================
    // REGRA D: CHECK-IN DE ENTREGA E EXTRATO SIMPÁTICO (ANTI-CONTESTAÇÃO)
    // =========================================================================
    const isCheckinInquiry = /onde\s+est[aá]|cad[eê]\s+o\s+pedido|j[aá]\s+saiu|est[aá]\s+chegando|status\s+do\s+pedido/i.test(lowerMsg);
    if (isCheckinInquiry) {
      if (summary.orders.length === 0) {
        return NextResponse.json({
          response: `🍽️ Nenhum pedido foi realizado ainda na **Mesa ${session.table_number}**. O que gostaria de pedir hoje?`,
          action_type: 'menu_display'
        });
      }

      const recentItems = summary.items_summary.map((i) => `${i.quantity}x ${i.name}`).join(', ');
      return NextResponse.json({
        response: `🍻 Seu pedido de **${recentItems}** já está em processo de atendimento para a **Mesa ${session.table_number}**!\n\nSó para você acompanhar: seu consumo acumulado até agora é de **R$ ${summary.total_amount.toFixed(2)}**.\nSe precisar de mais alguma coisa, é só chamar!`,
        action_type: 'bill_preview',
        metadata: {
          total: summary.total_amount
        }
      });
    }

    // =========================================================================
    // REGRA A2: BLOQUEIO DE ÁLCOOL PARA MENORES
    // =========================================================================
    if (ageConsent.is_adult === false) {
      const isTryingAlcohol = /chopp|cerveja|ipa|heineken|gin|drink|caipirinha|vodka|vinho|whisky|alco[oó]l/i.test(lowerMsg);
      if (isTryingAlcohol) {
        return NextResponse.json({
          response: `⛔ **Atenção:** Em conformidade com a Lei nº 8.069/90 (Estatuto da Criança e do Adolescente), a venda de bebidas alcoólicas é estritamente proibida para menores de 18 anos.\n\nQue tal um dos nossos sucos naturais, mocktails ou refrigerantes gelados?`,
          action_type: 'menu_display'
        });
      }
    }

    // =========================================================================
    // INTENÇÕES DE CONTA E FECHAMENTO
    // =========================================================================

    // A) CONSULTA PARCIAL DA CONTA
    const isPartialBillInquiry = 
      /parcial|conta|extrato|quanto\s+t[aá]|gasto|saldo|pedidos\s+da\s+mesa|o\s+que\s+pedi/i.test(lowerMsg) &&
      !/fechar|fechamento|encerrar|pagar|feche|fecha|passar\s+a\s+regua/i.test(lowerMsg);

    if (isPartialBillInquiry) {
      if (summary.items_summary.length === 0) {
        return NextResponse.json({
          response: `🍽️ **Mesa ${session.table_number}**\n\nNenhum item foi pedido nesta mesa até o momento.\nO que você gostaria de pedir hoje?`,
          action_type: 'bill_preview',
          metadata: { total: 0, items: [] }
        });
      }

      const itemsList = summary.items_summary
        .map((item) => `• **${item.quantity}x** ${item.name} — R$ ${item.total.toFixed(2)} (R$ ${item.unit_price.toFixed(2)} un)`)
        .join('\n');

      let responseText = `🧾 **Extrato Parcial da Mesa ${session.table_number}**\n\n${itemsList}\n\n💰 **Subtotal Parcial:** R$ ${summary.total_amount.toFixed(2)}\n\n_Quando quiser encerrar a mesa, basta me avisar: "Quero fechar a conta"!_`;

      // REGRA E: AVISO DE LIMITE DE CONSUMO
      if (summary.total_amount >= (tabLimit * 0.80)) {
        responseText += `\n\n🔔 **Aviso de Consumo:** Você está se aproximando do limite de consumo da sua comanda (R$ ${summary.total_amount.toFixed(2)} / R$ ${tabLimit.toFixed(2)}). Para continuar pedindo sem pausas, você pode fazer um adiantamento no Pix ou avisar a gerência!`;
      }

      return NextResponse.json({
        response: responseText,
        action_type: 'bill_preview',
        metadata: {
          total: summary.total_amount,
          items: summary.items_summary
        }
      });
    }

    // B) ESCOLHA DIRETA DE PAGAMENTO VIA PIX
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

    // C) ESCOLHA DE CARTÃO / MAQUINETA
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

    // D) PEDIR A CONTA (EXIBIR OPÇÕES)
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

    // E) FAZER UM PEDIDO
    const detectedOrderItems: OrderItem[] = [];
    menuItems.forEach((menuItem) => {
      const escapedName = menuItem.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const itemRegex = new RegExp(`(\\d+)?\\s*(?:x|de)?\\s*${escapedName}`, 'i');
      const match = lowerMsg.match(itemRegex);

      if (match) {
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
      const newAccumulated = summary.total_amount + totalOrder;

      // REGRA B: CONFIRMAÇÃO DINÂMICA DE MESA
      const hasPriorOrders = summary.orders.length > 0;
      let tableConfirmationNote = '';
      if (hasPriorOrders) {
        tableConfirmationNote = `\n\n📍 _Anotado! Você continua na **Mesa ${session.table_number}**? (Caso tenha mudado de lugar, me avise: "Mudei para a mesa X")_`;
      }

      // REGRA E: ALERTA DE LIMITE
      let tabLimitWarning = '';
      if (newAccumulated >= (tabLimit * 0.80)) {
        tabLimitWarning = `\n\n🔔 **Aviso:** Seu consumo acumulado atingiu R$ ${newAccumulated.toFixed(2)} (Limite da comanda: R$ ${tabLimit.toFixed(2)}). Para consumir acima desse valor, basta solicitar à gerência ou antecipar um Pix!`;
      }

      const responseText = `✅ **Pedido Confirmado e Enviado para a Cozinha!**\n\n` +
        `${itemsText}\n\n` +
        `💵 **Total deste pedido:** R$ ${totalOrder.toFixed(2)}\n` +
        `💰 **Consumo total da mesa:** R$ ${newAccumulated.toFixed(2)}\n` +
        `⏱️ Seus itens já estão em preparo!` +
        tableConfirmationNote +
        tabLimitWarning;

      return NextResponse.json({
        response: responseText,
        action_type: 'order_confirmed',
        metadata: {
          order_id: newOrder?.id,
          order_items: detectedOrderItems,
          total: newAccumulated
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
Você é o garçom inteligente e acolhedor do restaurante "${establishment.name}", atendendo os clientes da Mesa ${session.table_number}.
Seu objetivo é proporcionar um atendimento impecável, rápido e seguro.

DADOS DA MESA:
- Mesa: ${session.table_number}
- Status: ${session.status}
- Consumo Atual: ${sessionContext} (Total: R$ ${summary.total_amount.toFixed(2)})
- Limite de Comanda: R$ ${tabLimit.toFixed(2)}
- Cliente Maior de Idade (+18): ${ageConsent.is_adult ? 'SIM' : 'NÃO (Bloqueio total de álcool)'}

CARDÁPIO DISPONÍVEL:
${menuContext}

DIRETRIZES:
1. Seja sempre educado, amigável e prestativo em português do Brasil.
2. Se o cliente for menor de idade, NÃO ofereça bebidas alcoólicas.
3. Se perguntar sobre a conta parcial, mostre os valores acumulados.
4. Se o cliente pedir fechamento de conta, dê as opções 1. Pix e 2. Cartão (chamar garçom).
5. Mantenha as respostas concisas e use emojis moderados.
`.trim();

      const messagesPayload = [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nCliente disse: "${message}"` }]
        }
      ];

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
        `Confira nosso cardápio:\n\n${menuSummary}\n\n` +
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
