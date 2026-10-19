'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  UtensilsCrossed, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  DollarSign, 
  Check, 
  ExternalLink, 
  Plus, 
  ChefHat, 
  Sparkles, 
  Layers, 
  X, 
  ChevronRight,
  TrendingUp,
  Receipt,
  Search,
  BellRing
} from 'lucide-react';
import { 
  Establishment, 
  TableSessionWithOrders, 
  MenuItem, 
  PixKeyType 
} from '@/lib/types/garcom';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'tables' | 'pix' | 'menu'>('tables');
  const [establishment, setEstablishment] = useState<Establishment | null>(null);
  const [tables, setTables] = useState<TableSessionWithOrders[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'bill_requested' | 'closed'>('all');
  
  // Modal de Detalhes da Mesa
  const [selectedSession, setSelectedSession] = useState<TableSessionWithOrders | null>(null);

  // Estado do Formulário Pix
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('cnpj');
  const [pixBeneficiary, setPixBeneficiary] = useState('');
  const [savingPix, setSavingPix] = useState(false);
  const [pixFeedback, setPixFeedback] = useState<string | null>(null);

  // Estado do Formulário de Cardápio
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Burgers');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [savingMenuItem, setSavingMenuItem] = useState(false);

  // Carrega dados iniciais do estabelecimento e mesas
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      // 1. Carrega mesas e estabelecimento
      const res = await fetch('/api/garcom?action=tables&establishment=exemplo');
      const data = await res.json();
      if (data.establishment) {
        setEstablishment(data.establishment);
        setPixKey(data.establishment.pix_key || '');
        setPixKeyType(data.establishment.pix_key_type || 'cnpj');
        setPixBeneficiary(data.establishment.pix_beneficiary_name || '');
      }
      if (data.tables) {
        setTables(data.tables);
      }

      // 2. Carrega cardápio
      const menuRes = await fetch('/api/garcom?action=menu&establishment=exemplo');
      const menuData = await menuRes.json();
      if (menuData.menu) {
        setMenuItems(menuData.menu);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Polling resiliente a cada 6 segundos para acompanhar contas solicitadas
    const interval = setInterval(() => {
      loadData(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Ação Rápida: Confirmar Pagamento Pix ou Baixar Cartão
  const handleConfirmBill = async (session: TableSessionWithOrders) => {
    try {
      const res = await fetch('/api/garcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_bill',
          establishmentId: establishment?.id,
          sessionId: session.id,
          billRequestId: session.bill_request?.id
        })
      });

      if (res.ok) {
        if (selectedSession?.id === session.id) {
          setSelectedSession(null);
        }
        await loadData(true);
      }
    } catch (err) {
      console.error('Erro ao confirmar pagamento:', err);
    }
  };

  // Salvar Chave Pix do Dono
  const handleSavePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishment) return;
    setSavingPix(true);
    setPixFeedback(null);

    try {
      const res = await fetch('/api/garcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_pix',
          establishmentId: establishment.id,
          pix_key: pixKey,
          pix_key_type: pixKeyType,
          pix_beneficiary_name: pixBeneficiary
        })
      });

      if (res.ok) {
        setPixFeedback('Chave Pix e dados do beneficiário atualizados com sucesso!');
        await loadData(true);
        setTimeout(() => setPixFeedback(null), 4000);
      } else {
        setPixFeedback('Erro ao salvar configurações Pix.');
      }
    } catch (err) {
      setPixFeedback('Erro ao conectar ao servidor.');
    } finally {
      setSavingPix(false);
    }
  };

  // Salvar novo item no cardápio
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishment || !newItemName || !newItemPrice) return;
    setSavingMenuItem(true);

    try {
      const res = await fetch('/api/garcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_menu_item',
          establishmentId: establishment.id,
          item: {
            name: newItemName,
            category: newItemCategory,
            price: parseFloat(newItemPrice.replace(',', '.')),
            description: newItemDesc,
            is_available: true
          }
        })
      });

      if (res.ok) {
        setShowAddMenuModal(false);
        setNewItemName('');
        setNewItemPrice('');
        setNewItemDesc('');
        await loadData(true);
      }
    } catch (err) {
      console.error('Erro ao salvar item:', err);
    } finally {
      setSavingMenuItem(false);
    }
  };

  // Alternar disponibilidade do item
  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      const res = await fetch('/api/garcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_menu_item',
          establishmentId: establishment?.id,
          itemId: item.id,
          isAvailable: !item.is_available
        })
      });
      if (res.ok) {
        setMenuItems((prev) =>
          prev.map((m) => (m.id === item.id ? { ...m, is_available: !m.is_available } : m))
        );
      }
    } catch (err) {
      console.error('Erro ao alternar disponibilidade:', err);
    }
  };

  // Cálculos de Indicadores em Tempo Real
  const activeTablesCount = tables.filter((t) => t.status === 'open').length;
  const billRequestedCount = tables.filter((t) => t.status === 'bill_requested').length;
  const totalOpenAmount = tables
    .filter((t) => t.status === 'open' || t.status === 'bill_requested')
    .reduce((acc, t) => acc + (t.total_consumed || 0), 0);

  const filteredTables = tables.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="min-h-screen text-slate-100 bg-[#040c18] pb-16">
      {/* HEADER DE COMANDO VURIO */}
      <header className="sticky top-0 z-40 bg-[#040c18]/90 backdrop-blur-md border-b border-[#02c1db]/20 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#0077d1] to-[#02c1db] p-0.5 shadow-lg shadow-[#02c1db]/20">
              <div className="h-full w-full bg-[#040c18] rounded-[10px] flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-[#02c1db]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-wide">
                  {establishment?.name || 'Vurio Gastrobar'}
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#01cf9e]/15 text-[#01cf9e] border border-[#01cf9e]/30 rounded-full">
                  Ao Vivo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Painel de Gestão & Operação de Caixa Autônomo
              </p>
            </div>
          </div>

          {/* ABAS DO PAINEL */}
          <div className="flex items-center p-1 bg-[#082855]/70 border border-[#02c1db]/15 rounded-xl">
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'tables'
                  ? 'bg-[#02c1db] text-[#040c18] font-semibold shadow-md shadow-[#02c1db]/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Controle de Mesas & Caixa</span>
              {billRequestedCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[10px] animate-pulse">
                  {billRequestedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'menu'
                  ? 'bg-[#02c1db] text-[#040c18] font-semibold shadow-md shadow-[#02c1db]/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Cardápio</span>
            </button>

            <button
              onClick={() => setActiveTab('pix')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'pix'
                  ? 'bg-[#02c1db] text-[#040c18] font-semibold shadow-md shadow-[#02c1db]/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Configuração Pix</span>
            </button>
          </div>

          {/* ATALHOS EXTERNOS */}
          <div className="flex items-center gap-2">
            <Link
              href="/kitchen"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#052d6b]/80 border border-[#0077d1]/40 text-cyan-300 hover:bg-[#0077d1]/30 transition-colors"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>Tela KDS Cozinha</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>

            <Link
              href={`/chat?establishment=${establishment?.slug || 'exemplo'}&table=1`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Testar Mesa 1 (Chat)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>

            <button
              onClick={() => loadData()}
              disabled={refreshing}
              className="p-1.5 text-slate-400 hover:text-white bg-white/5 rounded-lg border border-white/10"
              title="Recarregar"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#02c1db]' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 mt-6">
        {/* ======================================================== */}
        {/* ABA 1: CONTROLE DE MESAS & CAIXA */}
        {/* ======================================================== */}
        {activeTab === 'tables' && (
          <div>
            {/* KPI METRICS BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-[#082855]/40 border border-[#02c1db]/15 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs uppercase font-medium tracking-wider">Mesas Ocupadas</span>
                  <UtensilsCrossed className="w-4 h-4 text-[#02c1db]" />
                </div>
                <div className="text-2xl font-bold text-white">{activeTablesCount}</div>
                <div className="text-[11px] text-slate-400 mt-1">Clientes consumindo no salão</div>
              </div>

              <div className={`p-4 rounded-xl border backdrop-blur-sm transition-all ${
                billRequestedCount > 0
                  ? 'bg-amber-950/30 border-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-[#082855]/40 border-[#02c1db]/15'
              }`}>
                <div className="flex items-center justify-between text-amber-300 mb-1">
                  <span className="text-xs uppercase font-medium tracking-wider">Contas Solicitadas</span>
                  <BellRing className={`w-4 h-4 ${billRequestedCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                </div>
                <div className="text-2xl font-bold text-amber-400">{billRequestedCount}</div>
                <div className="text-[11px] text-amber-300/80 mt-1">
                  {billRequestedCount > 0 ? 'Aguardando confirmação do caixa!' : 'Nenhuma conta pendente'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#082855]/40 border border-[#02c1db]/15 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs uppercase font-medium tracking-wider">Em Aberto no Salão</span>
                  <DollarSign className="w-4 h-4 text-[#01cf9e]" />
                </div>
                <div className="text-2xl font-bold text-[#01cf9e]">
                  R$ {totalOpenAmount.toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Soma dos consumos correntes</div>
              </div>

              <div className="p-4 rounded-xl bg-[#082855]/40 border border-[#02c1db]/15 backdrop-blur-sm">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-xs uppercase font-medium tracking-wider">Recebimento Pix</span>
                  <QrCode className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-sm font-semibold text-white truncate">
                  {establishment?.pix_beneficiary_name || 'Não configurado'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">
                  Chave: {establishment?.pix_key || 'Cadastre na aba Pix'}
                </div>
              </div>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#082855]/20 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                {(['all', 'bill_requested', 'open', 'closed'] as const).map((filter) => {
                  const labels = {
                    all: 'Todas as Mesas',
                    bill_requested: `Conta Solicitada (${billRequestedCount})`,
                    open: 'Em Consumo',
                    closed: 'Encerradas'
                  };
                  return (
                    <button
                      key={filter}
                      onClick={() => setFilterStatus(filter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filterStatus === filter
                          ? 'bg-[#0077d1] text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {labels[filter]}
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-400">
                Mostrando <strong className="text-white">{filteredTables.length}</strong> mesas
              </div>
            </div>

            {/* GRID DE MESAS */}
            {filteredTables.length === 0 ? (
              <div className="text-center py-16 px-4 bg-[#082855]/20 rounded-2xl border border-dashed border-white/10">
                <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">Nenhuma mesa nesta visualização</h3>
                <p className="text-sm text-slate-400 mt-1">
                  Quando clientes abrirem o QR code ou realizarem pedidos, as mesas aparecerão aqui automaticamente.
                </p>
                <div className="mt-4">
                  <Link
                    href={`/chat?establishment=${establishment?.slug || 'exemplo'}&table=1`}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#02c1db] text-[#040c18] font-bold text-xs rounded-xl shadow-lg shadow-[#02c1db]/20"
                  >
                    <Plus className="w-4 h-4" />
                    Simular Pedido na Mesa 1
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTables.map((session) => {
                  const isBillRequested = session.status === 'bill_requested';
                  const isOpen = session.status === 'open';
                  const isClosed = session.status === 'closed' || session.status === 'paid';
                  const paymentMethod = session.bill_request?.payment_method || 'pix';

                  return (
                    <div
                      key={session.id}
                      className={`relative rounded-2xl p-5 backdrop-blur-md transition-all flex flex-col justify-between ${
                        isBillRequested
                          ? 'bg-gradient-to-b from-[#2d1b04] to-[#120a02] border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 scale-[1.01]'
                          : isOpen
                          ? 'bg-[#082855]/40 border border-[#02c1db]/25 hover:border-[#02c1db]/50'
                          : 'bg-[#082855]/15 border border-white/5 opacity-75'
                      }`}
                    >
                      {/* TOPO DO CARD */}
                      <div>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base ${
                              isBillRequested
                                ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                                : isOpen
                                ? 'bg-[#02c1db]/15 text-[#02c1db] border border-[#02c1db]/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {session.table_number}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-base leading-tight">
                                Mesa {session.table_number}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {new Date(session.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* BADGE DE STATUS */}
                          {isBillRequested && (
                            <span className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950 rounded-full shadow-md animate-pulse">
                              <BellRing className="w-3 h-3" />
                              Conta Pedida ({paymentMethod === 'pix' ? 'Pix' : 'Cartão'})
                            </span>
                          )}
                          {isOpen && (
                            <span className="flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium bg-[#01cf9e]/15 text-[#01cf9e] border border-[#01cf9e]/30 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#01cf9e] animate-ping" />
                              Em Consumo
                            </span>
                          )}
                          {isClosed && (
                            <span className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-400 rounded-full">
                              Liberada
                            </span>
                          )}
                        </div>

                        {/* RESUMO DOS ITENS */}
                        <div className="my-3.5 pt-3 border-t border-white/5">
                          <div className="text-xs text-slate-400 mb-2 font-medium">Itens pedidos:</div>
                          {session.items_summary.length === 0 ? (
                            <div className="text-xs text-slate-500 italic">Mesa aberta, aguardando 1º pedido...</div>
                          ) : (
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {session.items_summary.slice(0, 4).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-slate-300 truncate max-w-[180px]">
                                    <strong className="text-white">{item.quantity}x</strong> {item.name}
                                  </span>
                                  <span className="text-slate-400 font-mono">
                                    R$ {item.total.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                              {session.items_summary.length > 4 && (
                                <div className="text-[11px] text-cyan-400 italic">
                                  + {session.items_summary.length - 4} outros itens
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* RODAPÉ DO CARD: TOTAL E AÇÕES RÁPIDAS */}
                      <div className="pt-3 border-t border-white/10 mt-2">
                        <div className="flex items-baseline justify-between mb-3">
                          <span className="text-xs text-slate-400 font-medium">Total da Mesa:</span>
                          <span className={`text-xl font-black font-mono ${
                            isBillRequested ? 'text-amber-300' : 'text-white'
                          }`}>
                            R$ {(session.total_consumed || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* BOTÕES DE AÇÃO */}
                        {isBillRequested && (
                          <div className="space-y-2">
                            {paymentMethod === 'pix' ? (
                              <button
                                onClick={() => handleConfirmBill(session)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition-transform active:scale-95"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Confirmar Pagamento Pix & Liberar</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleConfirmBill(session)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-400 hover:to-cyan-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
                              >
                                <CreditCard className="w-4 h-4" />
                                <span>Baixar Conta (Cartão Passado) & Liberar</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedSession(session)}
                              className="w-full py-1.5 text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              Ver Extrato Completo
                            </button>
                          </div>
                        )}

                        {isOpen && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedSession(session)}
                              className="flex-1 py-2 text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                            >
                              Ver Extrato
                            </button>
                            <button
                              onClick={() => handleConfirmBill(session)}
                              className="py-2 px-3 text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors"
                              title="Encerrar mesa manualmente"
                            >
                              Encerrar
                            </button>
                          </div>
                        )}

                        {isClosed && (
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span>Mesa liberada</span>
                            <button
                              onClick={() => setSelectedSession(session)}
                              className="text-cyan-400 hover:underline"
                            >
                              Histórico
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: CONFIGURAÇÃO PIX DO ESTABELECIMENTO */}
        {/* ======================================================== */}
        {activeTab === 'pix' && (
          <div className="max-w-3xl mx-auto">
            <div className="p-6 md:p-8 rounded-2xl bg-[#082855]/30 border border-[#02c1db]/20 backdrop-blur-md">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-[#02c1db]/10 border border-[#02c1db]/30 text-[#02c1db]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Configuração de Recebimento Pix</h2>
                  <p className="text-sm text-slate-300 mt-1">
                    Sem intermediadores nem custódia financeira. O dinheiro cai diretamente na conta bancária do seu restaurante.
                  </p>
                </div>
              </div>

              {pixFeedback && (
                <div className={`p-4 rounded-xl mb-6 text-sm flex items-center gap-2 ${
                  pixFeedback.includes('sucesso')
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{pixFeedback}</span>
                </div>
              )}

              <form onSubmit={handleSavePix} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Tipo de Chave Pix
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['cnpj', 'cpf', 'email', 'phone', 'random'] as const).map((type) => {
                      const labels = {
                        cnpj: 'CNPJ',
                        cpf: 'CPF',
                        email: 'E-mail',
                        phone: 'Celular',
                        random: 'Aleatória'
                      };
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPixKeyType(type)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                            pixKeyType === type
                              ? 'bg-[#02c1db] text-[#040c18] shadow-md shadow-[#02c1db]/25'
                              : 'bg-[#052d6b]/40 text-slate-300 border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {labels[type]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Chave Pix Oficial do Estabelecimento
                  </label>
                  <input
                    type="text"
                    required
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={
                      pixKeyType === 'cnpj'
                        ? '12.345.678/0001-90'
                        : pixKeyType === 'email'
                        ? 'financeiro@seurestaurante.com.br'
                        : pixKeyType === 'phone'
                        ? '(11) 98765-4321'
                        : 'Insira sua chave Pix'
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#040c18] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#02c1db] text-sm font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Essa chave será enviada diretamente aos clientes no chat ao solicitarem o fechamento via Pix.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Nome Completo do Beneficiário / Razão Social
                  </label>
                  <input
                    type="text"
                    required
                    value={pixBeneficiary}
                    onChange={(e) => setPixBeneficiary(e.target.value)}
                    placeholder="Ex: Vurio Restaurante e Bar Ltda"
                    className="w-full px-4 py-3 rounded-xl bg-[#040c18] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#02c1db] text-sm"
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Nome do titular que o cliente verá na tela de confirmação do aplicativo bancário dele.
                  </p>
                </div>

                {/* PREVIEW DO CHAT */}
                <div className="p-4 rounded-xl bg-[#040c18]/80 border border-white/10">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Preview do que o cliente receberá no chat:
                  </div>
                  <div className="p-3 rounded-lg bg-[#082855]/60 border border-[#02c1db]/20 text-xs text-slate-200 font-mono space-y-1">
                    <div>⚡ <strong>Fechamento via Pix</strong></div>
                    <div>💵 Total: <strong>R$ 82,90</strong></div>
                    <div>👤 Favorecido: <strong>{pixBeneficiary || 'Nome do Beneficiário'}</strong></div>
                    <div>🔑 Chave ({pixKeyType.toUpperCase()}): <strong className="text-cyan-300">{pixKey || 'chave-cadastrada'}</strong></div>
                    <div className="text-slate-400 text-[11px] pt-1 italic">
                      + Código Copia-e-Cola gerado automaticamente com 1 toque!
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPix}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0077d1] to-[#02c1db] hover:from-[#0066b3] hover:to-[#01a8bf] text-[#040c18] font-bold text-sm shadow-lg shadow-[#02c1db]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {savingPix ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Configuração Pix</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: GESTÃO DO CARDÁPIO */}
        {/* ======================================================== */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Cardápio do Estabelecimento</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Itens disponíveis para o assistente IA ofertar e registrar pedidos na mesa
                </p>
              </div>
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#02c1db] text-[#040c18] font-bold text-xs rounded-xl shadow-lg shadow-[#02c1db]/20 hover:bg-cyan-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Prato / Bebida</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
                    item.is_available
                      ? 'bg-[#082855]/30 border-[#02c1db]/15'
                      : 'bg-slate-900/40 border-rose-500/20 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-cyan-300 border border-white/10">
                        {item.category}
                      </span>
                      <h3 className="font-bold text-white text-base mt-1.5">{item.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {item.description || 'Sem descrição cadastrada'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black font-mono text-[#01cf9e]">
                        R$ {Number(item.price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Status: {item.is_available ? <strong className="text-emerald-400">Disponível</strong> : <strong className="text-rose-400">Esgotado</strong>}
                    </span>
                    <button
                      onClick={() => handleToggleAvailable(item)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        item.is_available
                          ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30'
                      }`}
                    >
                      {item.is_available ? 'Pausar Item' : 'Ativar Item'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DETALHES DA MESA */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#051d44] border border-[#02c1db]/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#02c1db]/20 border border-[#02c1db]/40 flex items-center justify-center text-[#02c1db] font-bold text-lg">
                {selectedSession.table_number}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Extrato Consolidado da Mesa {selectedSession.table_number}</h3>
                <p className="text-xs text-slate-400">
                  Aberta em: {new Date(selectedSession.opened_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="border-t border-b border-white/10 py-4 my-4 max-h-60 overflow-y-auto space-y-2 pr-2">
              {selectedSession.items_summary.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-4">Nenhum item consumido</div>
              ) : (
                selectedSession.items_summary.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-white/5">
                    <div>
                      <span className="font-bold text-white">{item.quantity}x</span>{' '}
                      <span className="text-slate-200">{item.name}</span>
                      <div className="text-[11px] text-slate-400">R$ {item.unit_price.toFixed(2)} cada</div>
                    </div>
                    <div className="font-mono font-bold text-white">
                      R$ {item.total.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-baseline justify-between mb-6">
              <span className="text-sm font-semibold text-slate-300">TOTAL CONSOLIDADO:</span>
              <span className="text-2xl font-black font-mono text-[#01cf9e]">
                R$ {selectedSession.total_consumed.toFixed(2)}
              </span>
            </div>

            {selectedSession.status !== 'closed' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleConfirmBill(selectedSession)}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Baixar Conta & Liberar Mesa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR ITEM AO CARDÁPIO */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#051d44] border border-[#02c1db]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddMenuModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">Adicionar Item ao Cardápio</h3>

            <form onSubmit={handleSaveMenuItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Prato / Bebida</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Iscas de Tilápia com Molho Tártaro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#040c18] border border-white/10 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#040c18] border border-white/10 text-white text-sm"
                  >
                    <option value="Burgers">Burgers</option>
                    <option value="Porções">Porções</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Sobremesas">Sobremesas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Preço (R$)</label>
                  <input
                    type="text"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="34.90"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#040c18] border border-white/10 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição / Ingredientes</label>
                <textarea
                  rows={3}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Detalhes para o assistente IA apresentar aos clientes..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#040c18] border border-white/10 text-white text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingMenuItem}
                className="w-full py-3 px-4 bg-[#02c1db] hover:bg-cyan-300 text-[#040c18] font-bold text-xs rounded-xl shadow-lg shadow-[#02c1db]/20 flex items-center justify-center gap-2"
              >
                {savingMenuItem ? 'Salvando...' : 'Cadastrar no Cardápio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
