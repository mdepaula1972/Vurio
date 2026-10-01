import { supabase, isSupabaseConfigured } from '../supabase/client';

export interface CompanyAccount {
  id: string;
  name: string;
  tradeName: string;
  cnpj: string;
  plan: 'STARTER' | 'COMPLIANCE_PRO' | 'ENTERPRISE';
  creditsBalance: number;
  monthlyAuditsCount: number;
  whatsappInstance: string;
  whatsappPhone?: string;
  whatsappStatus: 'connected' | 'waiting_qr' | 'disconnected';
  workCity: string;
  workState: string;
  contactEmail: string;
  active: boolean;
  createdAt: string;
}

const INITIAL_COMPANIES: CompanyAccount[] = [
  {
    id: 'solucione-matriz',
    name: 'Solucione Tecnologia & Consultoria Ltda',
    tradeName: 'Solucione Tech (Matriz)',
    cnpj: '42.189.542/0001-90',
    plan: 'ENTERPRISE',
    creditsBalance: 850,
    monthlyAuditsCount: 142,
    whatsappInstance: 'vurio',
    whatsappPhone: '+55 11 99999-0000',
    whatsappStatus: 'connected',
    workCity: 'São Paulo',
    workState: 'SP',
    contactEmail: 'rh@solucionetech.com.br',
    active: true,
    createdAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'metalurgica-silva',
    name: 'Metalúrgica Silva & Filhos S/A',
    tradeName: 'Metalúrgica Silva',
    cnpj: '18.342.981/0001-12',
    plan: 'COMPLIANCE_PRO',
    creditsBalance: 120,
    monthlyAuditsCount: 48,
    whatsappInstance: 'vurio_silva',
    whatsappPhone: '+55 19 99999-0001',
    whatsappStatus: 'waiting_qr',
    workCity: 'Campinas',
    workState: 'SP',
    contactEmail: 'dp@metalurgicasilva.com.br',
    active: true,
    createdAt: '2026-02-01T14:30:00.000Z'
  },
  {
    id: 'hospital-sao-lucas',
    name: 'Hospital e Maternidade São Lucas Ltda',
    tradeName: 'Hospital São Lucas',
    cnpj: '61.458.910/0001-45',
    plan: 'ENTERPRISE',
    creditsBalance: 1200,
    monthlyAuditsCount: 380,
    whatsappInstance: 'vurio_saolucas',
    whatsappPhone: '+55 13 99999-0002',
    whatsappStatus: 'connected',
    workCity: 'Santos',
    workState: 'SP',
    contactEmail: 'rh.saude@saolucas.med.br',
    active: true,
    createdAt: '2026-02-10T09:15:00.000Z'
  },
  {
    id: 'varejo-brasil',
    name: 'Rede Varejo Brasil Distribuidora S/A',
    tradeName: 'Rede Varejo Brasil',
    cnpj: '03.784.129/0001-88',
    plan: 'STARTER',
    creditsBalance: 45,
    monthlyAuditsCount: 22,
    whatsappInstance: 'vurio_varejo',
    whatsappPhone: '+55 11 99999-0003',
    whatsappStatus: 'disconnected',
    workCity: 'Guarulhos',
    workState: 'SP',
    contactEmail: 'genteegestao@varejobrasil.com.br',
    active: true,
    createdAt: '2026-03-01T11:00:00.000Z'
  }
];

let inMemoryCompaniesList: CompanyAccount[] = [...INITIAL_COMPANIES];

export async function getAllCompanies(): Promise<CompanyAccount[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((c: any) => ({
          id: c.id,
          name: c.legal_name || c.trade_name || 'Empresa',
          tradeName: c.trade_name || 'Empresa',
          cnpj: c.cnpj || '00.000.000/0001-00',
          plan: c.plan || 'COMPLIANCE_PRO',
          creditsBalance: c.credits_balance ?? 100,
          monthlyAuditsCount: c.monthly_audits ?? 0,
          whatsappInstance: c.whatsapp_instance || 'vurio',
          whatsappPhone: c.whatsapp_phone || undefined,
          whatsappStatus: c.whatsapp_status || 'waiting_qr',
          workCity: c.work_city || 'São Paulo',
          workState: c.work_state || 'SP',
          contactEmail: c.contact_email || 'contato@empresa.com',
          active: c.active !== false,
          createdAt: c.created_at || new Date().toISOString()
        }));
      }
    } catch (err) {
      console.warn('Fallback para empresas em memória:', err);
    }
  }
  return inMemoryCompaniesList;
}

export async function getCompanyById(id: string): Promise<CompanyAccount | null> {
  const all = await getAllCompanies();
  return all.find(c => c.id === id) || null;
}

export async function createCompany(newCompany: Omit<CompanyAccount, 'id' | 'createdAt' | 'monthlyAuditsCount'>): Promise<CompanyAccount> {
  const id = 'comp-' + Math.random().toString(36).substring(2, 9);
  const company: CompanyAccount = {
    ...newCompany,
    id,
    monthlyAuditsCount: 0,
    createdAt: new Date().toISOString()
  };
  inMemoryCompaniesList.unshift(company);
  return company;
}

export async function updateCompany(id: string, updates: Partial<CompanyAccount>): Promise<CompanyAccount | null> {
  const index = inMemoryCompaniesList.findIndex(c => c.id === id);
  if (index === -1) return null;
  inMemoryCompaniesList[index] = { ...inMemoryCompaniesList[index], ...updates };
  return inMemoryCompaniesList[index];
}
