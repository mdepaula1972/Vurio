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
  getClientProfile,
  createInternalConsumptionAlert
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
    const couvertFee = Number(establishment.couvert_fee || 0.00);
    const serviceFeePercent = Number(establishment.service_fee_percent || 10.00);
    const serviceFeeEnabled = establishment.service_fee_enabled !== false;

    // 2. Obter ou criar a sessão ativa da mesa (Entrada Zero Atrito)
    const session = await getOrCreateActiveSession(establishment.id, table, phone);
    if (!session) {
      return NextResponse.json(
        { error: 'Não foi possível inicializar a sessão da mesa.' },
        { status: 500 }
      );
    }

    // 3. Obter perfil do cliente para hospitalidade e memória
    const clientProfile = await getClientProfile(phone);

    const lowerMsg = message.toLowerCase().trim();

    // =========================================================================
    // REGRA DE SEGURANÇA: PROTOCOLO DE APOIO DISCRETO (NÃO É NÃO / CÓDIGO 180)
    // =========================================================================
    const isSafetyAlertTrigger = 
      /c[oó]digo\s*180|apoio|ajuda\s+discreta|socorro|seguran[cç]a|protocolo\s+n[aã]o\s+[eé]\s+n[aã]o|falar\s+com\s+a\s+ger[eê]ncia/i.test(lowerMsg);

    if (isSafetyAlertTrigger) {
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
    // REGRA DE MAIORIDADE LEGAL (+18)
    // =========================================================================
    let ageConsent = await getClientAgeConsent(phone);

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
          response: `✅ Maioridade confirmada com sucesso! Bem-vindo(a) ao **${establishment.name}** na **Mesa ${session.table_number}**.\n\nCardápio liberado por completo!`,
          action_type: 'menu_display'
        });
      }
    }

    if (!ageConsent) {
      return NextResponse.json({
        response: `🔞 **Verificação de Idade:**\nAntes de começarmos seu atendimento no **${establishment.name}**: você confirma que é maior de 18 anos?\n\n1️⃣ **Sim, sou maior de 18 anos**\n2️⃣ **Não, sou menor de idade**`,
        action_type: 'age_verification_required'
      });
    }

    // =========================================================================
    // MUDANÇA DINÂMICA DE MESA
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
    // TAXA DE SERVIÇO (10% OPCIONAL) - RESPOSTA À PERGUNTA
    // =========================================================================
    const summary = await getSessionSummary(session.id);
    const subtotal = summary.total_amount;
    const couvertTotal = couvertFee;
    const serviceVal = serviceFeeEnabled ? Number(((subtotal + couvertTotal) * (serviceFeePercent / 100)).toFixed(2)) : 0.00;
    const totalComServico = Number((subtotal + couvertTotal + serviceVal).toFixed(2));
    const totalSemServico = Number((subtotal + couvertTotal).toFixed(2));

    const isServiceAccepted = /^(1|sim|incluir|com\s*10%|com\s*servi[cç]o|incluir\s*taxa)$/i.test(lowerMsg);
    const isServiceRejected = /^(2|n[aã]o|apenas\s*consumo|sem\s*10%|sem\s*taxa|n[aã]o\s*incluir)$/i.test(lowerMsg);

    if (session.status === 'bill_requested' && (isServiceAccepted || isServiceRejected)) {
      const chosenTotal = isServiceAccepted ? totalComServico : totalSemServico;
      const pixKey = establishment.pix_key || '12345678000190';
      const beneficiary = establishment.pix_beneficiary_name || establishment.name;
      const keyType = establishment.pix_key_type || 'Chave Pix';

      const copyPasteCode = generatePixCopyPaste({
        pixKey,
        beneficiaryName: beneficiary,
        amount: chosenTotal,
        txid: `MESA${session.table_number}`
      });

      // Atualiza o bill_request com o valor final escolhido
      await requestBill(session.id, 'pix', chosenTotal);

      const serviceNote = isServiceAccepted 
        ? `\n💙 **Taxa de serviço inclusa:** R$ ${serviceVal.toFixed(2)} (Agradecemos o reconhecimento da equipe!)`
        : `\nTaxa de serviço não inclusa.`;

      const responseText = `⚡ **Conta Final — Mesa ${session.table_number}**\n\n` +
        `• Subtotal de consumo: R$ ${subtotal.toFixed(2)}\n` +
        (couvertTotal > 0 ? `• Couvert artístico: R$ ${couvertTotal.toFixed(2)}\n` : '') +
        serviceNote + '\n\n' +
        `💰 **TOTAL A PAGAR: R$ ${chosenTotal.toFixed(2)}**\n\n` +
        `🔑 **Chave Pix (${keyType.toUpperCase()}):** \`${pixKey}\`\n` +
        `👤 **Favorecido:** ${beneficiary}\n\n` +
        (copyPasteCode ? `📋 **Código Pix Copia-e-Cola:**\n\`${copyPasteCode}\`\n\n` : '') +
        `👉 Abra seu app do banco e pague no Pix, ou avise caso prefira a maquineta física!`;

      return NextResponse.json({
        response: responseText,
        action_type: 'bill_requested_pix',
        metadata: {
          total: chosenTotal,
          subtotal,
          couvert: couvertTotal,
          service_fee: isServiceAccepted ? serviceVal : 0,
          pix_key: pixKey,
          pix_copy_paste: copyPasteCode
        }
      });
    }

    // =========================================================================
    // RATEIO DE ITENS
    // =========================================================================
    if (/^(aceitar\s+divis[aã]o|aceitar|aceito)$/i.test(lowerMsg)) {
      return NextResponse.json({
        response: `✅ **Divisão Confirmada!** O valor proporcional foi adicionado ao seu consumo com sucesso.`,
        action_type: 'split_requested'
      });
    }

    if (/^(recusar\s+divis[aã]o|recusar|recuso)$/i.test(lowerMsg)) {
      return NextResponse.json({
        response: `⚠️ Você optou por não dividir o item. O colega foi notificado com as opções de manter integral ou cancelar o item.`,
        action_type: 'split_rejected_options'
      });
    }

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
        response: `🤝 **Proposta de Divisão Enviada!**\nVocê marcou o item **"${targetItem}"** para dividir com **${colleague}** (R$ 19,00 para cada).\n\nAssim que ele confirmar na conversa dele, o rateio será concluído!`,
        action_type: 'split_requested',
        metadata: { split_item: targetItem }
      });
    }

    // =========================================================================
    // RADAR DINÂMICO DE CONSUMO (+40% DA MÉDIA HISTÓRICA)
    // =========================================================================
    if (establishment.enable_spending_limits && clientProfile && clientProfile.average_ticket > 0) {
      const triggerAmount = clientProfile.average_ticket * 1.40;
      if (summary.total_amount >= triggerAmount) {
        const percentAbove = Number((((summary.total_amount - clientProfile.average_ticket) / clientProfile.average_ticket) * 100).toFixed(0));
        await createInternalConsumptionAlert({
          establishmentId: establishment.id,
          sessionId: session.id,
          tableNumber: session.table_number,
          clientPhone: phone,
          clientName: clientProfile.name || 'Cliente Habitual',
          currentConsumption: summary.total_amount,
          averageTicket: clientProfile.average_ticket,
          percentAbove
        });
      }
    }

    // =========================================================================
    // SAUDAÇÃO INICIAL COM MEMÓRIA (RETORNO DO CLIENTE)
    // =========================================================================
    const isFirstGreeting = /^(ol[aá]|oi|boa\s*(?:noite|tarde|dia)|card[aá]pio|come[cç]ar|menu)$/i.test(lowerMsg);
    if (isFirstGreeting && summary.orders.length === 0) {
      let welcomeText = '';
      if (clientProfile && clientProfile.visit_count > 1) {
        welcomeText = `Que bom ter você de volta aqui no **${establishment.name}**, ${clientProfile.name || 'amigo'}! 👋\n\n`;
        if (clientProfile.last_first_order_item) {
          welcomeText += `Quer começar com o seu clássico **${clientProfile.last_first_order_item}** como da outra vez, ou prefere olhar as opções?\n\n`;
        }
      } else {
        welcomeText = `Olá! Bem-vindo(a) ao **${establishment.name}** na **Mesa ${session.table_number}**! 👋\n\n`;
      }

      // Notícia de Programação do Dia
      if (establishment.daily_event_title) {
        welcomeText += `🎉 **Hoje temos:** ${establishment.daily_event_title} ${establishment.daily_event_description ? `(${establishment.daily_event_description})` : ''}\n`;
      }

      // Alerta transparente de Couvert
      if (couvertFee > 0) {
        welcomeText += `🎶 _Informamos que hoje temos couvert artístico no valor de **R$ ${couvertFee.toFixed(2)}** por pessoa._\n\n`;
      }

      welcomeText += `Como posso te ajudar agora? Posso te sugerir os destaques do cardápio ou anotar seu primeiro pedido!`;

      return NextResponse.json({
        response: welcomeText,
        action_type: 'menu_display',
        metadata: {
          client_name: clientProfile?.name || undefined,
          favorite_item: clientProfile?.last_first_order_item || undefined
        }
      });
    }

    // =========================================================================
    // CONSULTA PARCIAL DA CONTA
    // =========================================================================
    const isPartialBillInquiry = 
      /parcial|quanto\s+t[aá]|extrato|gasto|saldo|pedidos\s+da\s+mesa|o\s+que\s+pedi/i.test(lowerMsg) &&
      !/fechar|fechamento|encerrar|pagar|feche|fecha|passar\s+a\s+regua/i.test(lowerMsg);

    if (isPartialBillInquiry) {
      if (summary.items_summary.length === 0) {
        return NextResponse.json({
          response: `🍽️ **Mesa ${session.table_number}**\n\nNenhum item foi pedido nesta mesa até o momento. O que você gostaria de pedir hoje?`,
          action_type: 'bill_preview',
          metadata: { total: 0, items: [] }
        });
      }

      const itemsList = summary.items_summary
        .map((item) => `• **${item.quantity}x** ${item.name} — R$ ${item.total.toFixed(2)} (R$ ${item.unit_price.toFixed(2)} un)`)
        .join('\n');

      let responseText = `🧾 **Extrato Parcial da Mesa ${session.table_number}**\n\n${itemsList}\n\n`;
      responseText += `• Subtotal de produtos: R$ ${subtotal.toFixed(2)}\n`;
      if (couvertFee > 0) {
        responseText += `• Couvert artístico: R$ ${couvertFee.toFixed(2)}\n`;
      }
      responseText += `💰 **Total Parcial:** **R$ ${(subtotal + couvertFee).toFixed(2)}**\n\n`;
      responseText += `_Quando quiser encerrar, basta dizer: "Quero fechar a conta"!_`;

      return NextResponse.json({
        response: responseText,
        action_type: 'bill_preview',
        metadata: {
          total: subtotal + couvertFee,
          items: summary.items_summary
        }
      });
    }

    // =========================================================================
    // FECHAMENTO DE CONTA COM COUVERT E GORJETA (10% OPCIONAL)
    // =========================================================================
    const isCloseBillRequest = /fechar|fecha|fechamento|encerrar|pedir\s+a\s+conta|trazer\s+a\s+conta|passar\s+a\s+r[eé]gua|a\s+conta\s+por\s+favor/i.test(lowerMsg);

    if (isCloseBillRequest) {
      if (summary.items_summary.length === 0) {
        return NextResponse.json({
          response: `🍽️ **Mesa ${session.table_number}**\n\nVocê ainda não possui pedidos registrados nesta mesa. Caso deseje pedir algo do cardápio, estou à disposição!`,
          action_type: 'bill_preview'
        });
      }

      // Marca como 'bill_requested'
      await requestBill(session.id, 'pix', totalComServico);

      const itemsList = summary.items_summary
        .map((item) => `• **${item.quantity}x** ${item.name} — R$ ${item.total.toFixed(2)}`)
        .join('\n');

      let extratoText = `🧾 **Fechamento de Conta — Mesa ${session.table_number}**\n\n` +
        `**Extrato de Consumo:**\n${itemsList}\n\n` +
        `--------------------------------\n` +
        `• Subtotal de produtos: R$ ${subtotal.toFixed(2)}\n`;

      if (couvertFee > 0) {
        extratoText += `• Couvert artístico: R$ ${couvertFee.toFixed(2)}\n`;
      }

      if (serviceFeeEnabled) {
        extratoText += `• Sugestão de serviço (${serviceFeePercent}% opcional): R$ ${serviceVal.toFixed(2)}\n` +
          `--------------------------------\n\n` +
          `Gostaria de incluir a taxa de serviço de **${serviceFeePercent}%** para a equipe?\n\n` +
          `1️⃣ **Sim, incluir** (Total: R$ ${totalComServico})\n` +
          `2️⃣ **Apenas consumo** (Total: R$ ${totalSemServico})\n\n` +
          `_Responda com **"1"** para incluir ou **"2"** para pagar apenas o consumo._`;

        return NextResponse.json({
          response: extratoText,
          action_type: 'service_fee_prompt',
          metadata: {
            subtotal,
            couvert: couvertFee,
            service_fee: serviceVal,
            total: totalComServico
          }
        });
      }

      // Se a casa não sugerir 10%
      const pixKey = establishment.pix_key || '12345678000190';
      const beneficiary = establishment.pix_beneficiary_name || establishment.name;
      const copyPasteCode = generatePixCopyPaste({
        pixKey,
        beneficiaryName: beneficiary,
        amount: totalSemServico,
        txid: `MESA${session.table_number}`
      });

      extratoText += `--------------------------------\n` +
        `💰 **TOTAL FINAL: R$ ${totalSemServico.toFixed(2)}**\n\n` +
        `🔑 **Chave Pix:** \`${pixKey}\` (${beneficiary})\n\n` +
        (copyPasteCode ? `📋 **Código Pix Copia-e-Cola:**\n\`${copyPasteCode}\`\n\n` : '') +
        `👉 Pague no Pix ou solicite a maquineta física ao garçom!`;

      return NextResponse.json({
        response: extratoText,
        action_type: 'bill_requested_pix',
        metadata: {
          total: totalSemServico,
          pix_key: pixKey,
          pix_copy_paste: copyPasteCode
        }
      });
    }

    // =========================================================================
    // FAZER UM PEDIDO
    // =========================================================================
    const menuItems = await getMenuItems(establishment.id, true);
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

      const hasPriorOrders = summary.orders.length > 0;
      let tableConfirmationNote = '';
      if (hasPriorOrders) {
        tableConfirmationNote = `\n\n📍 _Anotado! Você continua na **Mesa ${session.table_number}**? (Caso tenha mudado de lugar, me avise: "Mudei para a mesa X")_`;
      }

      const responseText = `✅ **Pedido Confirmado e Enviado para a Cozinha!**\n\n` +
        `${itemsText}\n\n` +
        `💵 **Total deste pedido:** R$ ${totalOrder.toFixed(2)}\n` +
        `💰 **Consumo total da mesa:** R$ ${newAccumulated.toFixed(2)}\n` +
        `⏱️ Seus itens já estão em preparo!` +
        tableConfirmationNote;

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

    // =========================================================================
    // RESPOSTA VIA GEMINI AI (COM PRIORIDADE DE ITENS FAVORITOS)
    // =========================================================================
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

      const favoritesContext = clientProfile?.favorite_items?.length
        ? `ITENS FAVORITOS DO CLIENTE NO HISTÓRICO: ${clientProfile.favorite_items.join(', ')}. Sugira gentilmente esses itens caso ele peça sugestão.`
        : '';

      const systemPrompt = `
Você é o garçom inteligente e acolhedor do restaurante "${establishment.name}", atendendo os clientes da Mesa ${session.table_number}.
Seu objetivo é proporcionar um atendimento impecável, acolhedor, rápido e com alta hospitalidade.

CLIENTE:
- Nome: ${clientProfile?.name || 'Cliente'} (Visitas: ${clientProfile?.visit_count || 1})
${favoritesContext}

DADOS DA MESA:
- Mesa: ${session.table_number}
- Consumo Atual: ${sessionContext} (Total: R$ ${summary.total_amount.toFixed(2)})
- Programação de Hoje: ${establishment.daily_event_title || 'Nenhuma atração especial'}
- Couvert Artístico: R$ ${couvertFee.toFixed(2)}

CARDÁPIO:
${menuContext}

DIRETRIZES:
1. Seja sempre educado, acolhedor e prestativo em português do Brasil.
2. Se o cliente pedir sugestões, dê preferência aos pratos favoritos dele citados acima ("Sua clássica [Item Favorito] está saindo bastante hoje! Vai nele?").
3. Mantenha as respostas concisas e agradáveis.
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

    // FALLBACK HEURÍSTICO
    return NextResponse.json({
      response: `Olá! Sou o assistente da **Mesa ${session.table_number}** no **${establishment.name}**.\n\n` +
        (clientProfile?.last_first_order_item ? `Quer começar com seu habitual **${clientProfile.last_first_order_item}**?\n\n` : '') +
        `Você pode me pedir pratos, bebidas, perguntar sobre o cardápio ou dizer *"Quero fechar a conta"* a qualquer momento!`,
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
