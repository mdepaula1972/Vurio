'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Utensils, 
  Check, 
  Flame, 
  Bell, 
  ArrowLeft 
} from 'lucide-react';
import { Order, TableSession } from '@/lib/types/garcom';

type KitchenOrder = Order & { session_status: TableSession['status'] };

export default function KitchenKDSPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'received' | 'preparing' | 'ready'>('all');

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Inicializa a Web Audio API
  const initAudio = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setAudioEnabled(true);
      // Toca um bipe de teste
      playChime();
    } catch (err) {
      console.warn('Erro ao inicializar Web Audio:', err);
    }
  };

  // Sintetizador de alerta sonoro harmônico (Web Audio API)
  const playChime = useCallback(() => {
    try {
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      // Tom 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tom 2: 880 Hz (A5) com leve delay
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0.3, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.8);
    } catch (err) {
      console.warn('Falha ao tocar som:', err);
    }
  }, []);

  // Carrega pedidos do KDS
  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/garcom?action=kitchen&establishment=exemplo');
      const data = await res.json();
      if (data.orders) {
        const fetchedOrders: KitchenOrder[] = data.orders;

        // Verifica se há novos pedidos que ainda não foram vistos
        let hasNewOrder = false;
        fetchedOrders.forEach((o) => {
          if (!knownOrderIdsRef.current.has(o.id) && o.status === 'received') {
            hasNewOrder = true;
          }
          knownOrderIdsRef.current.add(o.id);
        });

        if (hasNewOrder && audioEnabled) {
          playChime();
        }

        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos no KDS:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [audioEnabled, playChime]);

  useEffect(() => {
    fetchOrders();
    // Polling frequente para a cozinha (4s)
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Transição de status do pedido
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await fetch('/api/garcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_order_status',
          establishmentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          orderId,
          status: newStatus
        })
      });

      if (res.ok) {
        setOrders((prev) =>
          newStatus === 'delivered' || newStatus === 'cancelled'
            ? prev.filter((o) => o.id !== orderId)
            : prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar status do pedido:', err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterCategory === 'all') return true;
    return o.status === filterCategory;
  });

  const getElapsedTimeText = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Agora';
    return `${diffMins} min`;
  };

  return (
    <div className="min-h-screen bg-[#020813] text-slate-100 flex flex-col">
      {/* HEADER KDS DE ALTO CONTRASTE */}
      <header className="bg-[#05162e] border-b border-[#02c1db]/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-wider uppercase">
                KDS Cozinha & Bar
              </h1>
              <span className="px-2 py-0.5 text-xs font-bold bg-orange-500/20 text-orange-400 rounded-md border border-orange-500/30">
                {orders.length} Ativos
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistema de Produção em Tempo Real — Vurio Garçom
            </p>
          </div>
        </div>

        {/* CONTROLES E BOTÃO DE ÁUDIO */}
        <div className="flex items-center gap-3">
          {audioEnabled ? (
            <button
              onClick={() => setAudioEnabled(false)}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-900/40 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Alerta Sonoro Ativo</span>
            </button>
          ) : (
            <button
              onClick={initAudio}
              className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500/30 animate-pulse transition-colors"
            >
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span>Ativar Som do KDS (Clique Aqui)</span>
            </button>
          )}

          <div className="flex items-center bg-[#082855]/70 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterCategory === 'all' ? 'bg-[#02c1db] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setFilterCategory('received')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterCategory === 'received' ? 'bg-[#02c1db] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Novos ({orders.filter((o) => o.status === 'received').length})
            </button>
            <button
              onClick={() => setFilterCategory('preparing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterCategory === 'preparing' ? 'bg-[#02c1db] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Preparando ({orders.filter((o) => o.status === 'preparing').length})
            </button>
            <button
              onClick={() => setFilterCategory('ready')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filterCategory === 'ready' ? 'bg-[#02c1db] text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Prontos ({orders.filter((o) => o.status === 'ready').length})
            </button>
          </div>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin</span>
          </Link>
        </div>
      </header>

      {/* ÁREA DE PEDIDOS KDS */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {filteredOrders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/10 rounded-2xl bg-[#05162e]/30">
            <ChefHat className="w-16 h-16 text-slate-600 mb-3" />
            <h2 className="text-xl font-bold text-white">Nenhum pedido pendente na cozinha</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              Os pedidos enviados pelos clientes via chat aparecerão aqui instantaneamente com alerta sonoro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredOrders.map((order) => {
              const elapsed = getElapsedTimeText(order.created_at);
              const isOld = (Date.now() - new Date(order.created_at).getTime()) > 15 * 60000;
              const isMesaEncerrando = order.session_status === 'bill_requested' || order.session_status === 'closed';

              return (
                <div
                  key={order.id}
                  className={`flex flex-col justify-between rounded-2xl border-2 transition-all overflow-hidden ${
                    isMesaEncerrando
                      ? 'bg-[#2a0808] border-red-500 shadow-2xl shadow-red-500/30'
                      : order.status === 'received'
                      ? 'bg-[#051c3d] border-amber-400/80 shadow-lg shadow-amber-500/10'
                      : order.status === 'preparing'
                      ? 'bg-[#082855] border-[#02c1db]/60 shadow-lg shadow-[#02c1db]/10'
                      : 'bg-[#04241e] border-emerald-400/80'
                  }`}
                >
                  {/* SINALIZAÇÃO CRÍTICA: MESA SOLICITOU A CONTA OU FOI FECHADA */}
                  {isMesaEncerrando && (
                    <div className="bg-red-600 text-white font-black text-xs uppercase tracking-wider py-1.5 px-3 flex items-center justify-center gap-1.5 animate-pulse">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>ATENÇÃO: MESA SOLICITOU A CONTA!</span>
                    </div>
                  )}

                  {/* TOPO DO CARD */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                          MESA
                        </div>
                        <div className="text-3xl font-black text-white font-mono leading-none mt-0.5">
                          #{order.table_number}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isOld
                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse'
                            : 'bg-white/10 text-slate-300'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {elapsed}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* STATUS ATUAL */}
                    <div className="mt-3">
                      {order.status === 'received' && (
                        <span className="inline-block px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black text-[11px] rounded uppercase tracking-wider">
                          Pendente
                        </span>
                      )}
                      {order.status === 'preparing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cyan-400 text-slate-950 font-black text-[11px] rounded uppercase tracking-wider">
                          <Flame className="w-3 h-3" />
                          Em Preparo
                        </span>
                      )}
                      {order.status === 'ready' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-400 text-slate-950 font-black text-[11px] rounded uppercase tracking-wider">
                          <Check className="w-3 h-3" />
                          Pronto no Pass
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ITENS DO PEDIDO */}
                  <div className="p-4 flex-1 space-y-3">
                    <div className="space-y-2">
                      {Array.isArray(order.items) &&
                        order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 p-2 rounded-lg bg-black/20 border border-white/5"
                          >
                            <span className="w-6 h-6 rounded bg-[#02c1db]/20 text-[#02c1db] font-black text-sm flex items-center justify-center flex-shrink-0">
                              {item.quantity}
                            </span>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-white leading-tight">
                                {item.name}
                              </div>
                              {item.notes && (
                                <div className="text-xs text-amber-300 italic mt-0.5">
                                  Obs: {item.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>

                    {order.notes && (
                      <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs">
                        <strong>Obs Geral:</strong> {order.notes}
                      </div>
                    )}
                  </div>

                  {/* AÇÕES DE STATUS DO PEDIDO */}
                  <div className="p-3 bg-black/30 border-t border-white/10">
                    {order.status === 'received' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-400 hover:from-amber-400 hover:to-orange-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Iniciar Preparo</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        className="w-full py-3 px-4 bg-gradient-to-r from-[#0077d1] to-[#02c1db] hover:from-blue-400 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                      >
                        <Check className="w-4 h-4" />
                        <span>Marcar como Pronto</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'delivered')}
                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entregue na Mesa (Concluir)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
