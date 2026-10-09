import { NextRequest, NextResponse } from 'next/server';
import { createCompany } from '@/lib/services/company-service';
import { verifyTrialEligibility, recordTrialGrant } from '@/lib/security/anti-abuse-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Armazenamento em memória de leads para campanhas futuras e CRM (quando trial ativo)
const inMemoryLeads: any[] = [];

export async function POST(req: NextRequest) {
  try {
    // FLAG DO TRIAL (Padrão: false)
    const TRIAL_ENABLED = process.env.TRIAL_ENABLED === 'true';

    if (!TRIAL_ENABLED) {
      return NextResponse.json(
        { 
          success: false, 
          trialEnabled: false,
          message: 'Teste grátis em breve. Fale conosco pelo WhatsApp.' 
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { fullName, email, phone, companyName, employeeRange, cnpj } = body;

    if (!email || !companyName || !phone) {
      return NextResponse.json(
        { success: false, error: 'E-mail corporativo, Telefone/WhatsApp e Nome da Empresa são obrigatórios.' },
        { status: 400 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      '127.0.0.1';

    // 1. Blindagem Anti-Abuso e Anti-Fraude
    const eligibility = await verifyTrialEligibility({
      email,
      cnpj,
      phone,
      companyName,
      ipAddress
    });

    if (!eligibility.allowed) {
      return NextResponse.json(
        { success: false, error: eligibility.reason },
        { status: 403 }
      );
    }

    // 2. Registrar concessão de trial no histórico para impedir duplicidades
    recordTrialGrant({
      email,
      cnpj: eligibility.cleanCnpj || cnpj,
      phone,
      ipAddress
    });

    // 3. Salvar lead no banco/memória para futuras campanhas de marketing
    const leadRecord = {
      id: 'lead-' + Date.now(),
      fullName: fullName || 'Responsável RH',
      email: email.trim().toLowerCase(),
      phone: phone ? phone.replace(/\D/g, '') : '',
      companyName: companyName.trim(),
      cnpj: eligibility.cleanCnpj || cnpj || '',
      employeeRange: employeeRange || '100 a 500',
      createdAt: new Date().toISOString()
    };
    inMemoryLeads.unshift(leadRecord);

    // 4. Criar automaticamente a empresa com 15 créditos gratuitos
    const company = await createCompany({
      name: companyName.trim(),
      tradeName: companyName.trim(),
      cnpj: eligibility.cleanCnpj ? 
        eligibility.cleanCnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : 
        '00.000.000/0001-00',
      plan: 'STARTER',
      creditsBalance: 15,
      workCity: 'São Paulo',
      workState: 'SP',
      contactEmail: email.trim(),
      whatsappPhone: phone || undefined,
      whatsappInstance: 'vurio_' + (phone ? phone.replace(/\D/g, '').slice(-6) : 'trial'),
      whatsappStatus: 'waiting_qr',
      active: true
    });

    // 5. Montar link parametrizado para o WhatsApp do robô do Vurio
    const botPhone = process.env.WHATSAPP_BOT_PHONE || '551331500987';
    const rawGreeting = `Olá! Acabei de me cadastrar no Vurio para ativar minhas 15 consultas gratuitas. Meu e-mail corporativo é: ${email} da empresa ${companyName}.`;
    const encodedGreeting = encodeURIComponent(rawGreeting);
    const whatsappUrl = `https://wa.me/${botPhone}?text=${encodedGreeting}`;

    return NextResponse.json({
      success: true,
      trialEnabled: true,
      lead: leadRecord,
      company,
      whatsappUrl,
      dashboardUrl: '/dashboard'
    });
  } catch (error: any) {
    console.error('Erro ao registrar trial:', (error as any)?.message || 'Erro no registro');
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function GET() {
  const TRIAL_ENABLED = process.env.TRIAL_ENABLED === 'true';
  return NextResponse.json({ 
    success: true, 
    trialEnabled: TRIAL_ENABLED,
    leadsCount: inMemoryLeads.length, 
    leads: inMemoryLeads 
  });
}
