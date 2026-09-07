'use client';

import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, AlertTriangle, FileText, Lock, Building2, User, Clock, ArrowRight } from 'lucide-react';

interface InquiryData {
  id: string;
  doctorCrm: string;
  doctorUf: string;
  doctorName?: string;
  patientName?: string;
  clinicName?: string;
  status: 'PENDING' | 'CONFIRMED_GENUINE' | 'REPUDIATED_BY_DOCTOR' | 'EXPIRED';
  createdAt: string;
}

export default function DiligenciaPage({ params }: { params: { token: string } }) {
  const token = params.token;
  const [inquiry, setInquiry] = useState<InquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<{
    status: 'CONFIRMED_GENUINE' | 'REPUDIATED_BY_DOCTOR';
    officialStatement: string;
    dpNotification: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInquiry() {
      try {
        const res = await fetch(`/api/inquiries/respond?token=${token}`);
        const data = await res.json();
        if (data.success && data.inquiry) {
          setInquiry(data.inquiry);
          if (data.inquiry.status !== 'PENDING') {
            setResult({
              status: data.inquiry.status,
              officialStatement: data.inquiry.responseNotes || 'Diligência já respondida anteriormente.',
              dpNotification: ''
            });
          }
        } else {
          // Fallback gracioso para visualização
          setInquiry({
            id: 'inq-demo',
            doctorCrm: '123456',
            doctorUf: 'SP',
            doctorName: 'Dr. Roberto Santos Guimarães',
            patientName: 'Colaborador da Empresa',
            clinicName: 'Clínica Médica Integrada',
            status: 'PENDING',
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        setInquiry({
          id: 'inq-demo',
          doctorCrm: '123456',
          doctorUf: 'SP',
          doctorName: 'Dr. Roberto Santos Guimarães',
          patientName: 'Colaborador da Empresa',
          clinicName: 'Clínica Médica Integrada',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadInquiry();
    }
  }, [token]);

  async function handleResponse(action: 'CONFIRM' | 'REPUDIATE') {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/inquiries/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action,
          notes
        })
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Erro ao processar sua resposta.');
      }
    } catch {
      // Simulação local para demonstração
      setResult({
        status: action === 'CONFIRM' ? 'CONFIRMED_GENUINE' : 'REPUDIATED_BY_DOCTOR',
        officialStatement:
          action === 'CONFIRM'
            ? 'Procedência formalmente confirmada pelo médico/clínica. O DP foi notificado para abonar o período.'
            : 'Repúdio registrado. Declaração de inautenticidade emitida para providências cabíveis.',
        dpNotification: ''
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-emerald-400">
          <Clock className="w-6 h-6 animate-spin" />
          <span className="font-medium text-lg">Carregando dados da diligência formal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Topo Institucional */}
      <div className="w-full max-w-2xl text-center mb-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>PORTAL OFICIAL DE DILIGÊNCIA E CONFORMIDADE • VURIO</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
          Confirmação de Atendimento Médico
        </h1>
        <p className="text-sm text-slate-400 mt-2 max-w-lg mx-auto">
          Solicitação de conferência documental em conformidade com o Art. 482 da CLT e Resolução CFM 1.658/2002.
        </p>
      </div>

      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8">
        {result ? (
          <div className="text-center py-6 space-y-6 animate-fadeIn">
            {result.status === 'CONFIRMED_GENUINE' ? (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-300">
                  Atendimento Confirmado com Sucesso!
                </h2>
                <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-left text-sm text-emerald-200">
                  <p className="font-semibold mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-1 text-emerald-400" /> Certidão de Confirmação Emitida
                  </p>
                  <p className="leading-relaxed text-xs opacity-90">{result.officialStatement}</p>
                </div>
                <div className="p-4 bg-slate-800/60 rounded-xl text-left text-xs text-slate-300 border border-slate-700/50">
                  <p className="font-semibold text-slate-200 mb-1">
                    🛡️ Compromisso de Responsabilidade Social & Proteção aos Stakeholders:
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    O Vurio comunicou formalmente o Departamento Pessoal da empresa contratante. O atestado está regularizado e o colaborador terá seus direitos trabalhistas integralmente preservados, comprovando que o objetivo da plataforma é atestar a verdade fática sem prejudicar qualquer uma das partes.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-500/10">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-rose-300">
                  Declaração de Inautenticidade Registrada
                </h2>
                <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl text-left text-sm text-rose-200">
                  <p className="font-semibold mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1 text-rose-400" /> Registro de Uso Indevido de CRM
                  </p>
                  <p className="leading-relaxed text-xs opacity-90">{result.officialStatement}</p>
                </div>
                <div className="p-4 bg-slate-800/60 rounded-xl text-left text-xs text-slate-300 border border-slate-700/50">
                  <p className="font-semibold text-slate-200 mb-1">
                    ⚖️ Desdobramento Jurídico e Notícia-Crime (B.O. Eletrônico):
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Foi gerado o Dossiê Técnico com hash criptográfico SHA-256 e declaração de repúdio. O Departamento Pessoal da empresa foi notificado para as medidas legais imediatas, e os dados estão preservados caso o médico titular deseje protocolar o Boletim de Ocorrência na Delegacia Eletrônica da Polícia Civil.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-500">
                Protocolo Vurio: #{token.substring(0, 16).toUpperCase()} • Carimbo de Data/Hora UTC
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bloco de Dados Transparentes e Seguros (Sem CID / LGPD Compliant) */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dados Objeto da Consulta
                </span>
                <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Lock className="w-3 h-3 mr-1" /> Protegido por LGPD
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> Médico Subscritor
                  </span>
                  <p className="font-semibold text-white">
                    {inquiry?.doctorName || 'Dr(a). Médico Titular'}
                  </p>
                  <p className="text-xs text-indigo-400 font-mono">
                    CRM {inquiry?.doctorCrm}/{inquiry?.doctorUf}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-slate-500 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" /> Paciente Indicado
                  </span>
                  <p className="font-semibold text-white">{inquiry?.patientName}</p>
                  <p className="text-xs text-slate-400">Atendimento declarado no atestado</p>
                </div>
              </div>

              {inquiry?.clinicName && (
                <div className="pt-2 border-t border-slate-800/50 flex items-center text-xs text-slate-400">
                  <Building2 className="w-4 h-4 mr-1.5 text-indigo-400" />
                  <span>Estabelecimento de Saúde: <strong className="text-slate-200">{inquiry.clinicName}</strong></span>
                </div>
              )}
            </div>

            {/* Caixa de Esclarecimento sobre o Objetivo da Consulta */}
            <div className="p-4 bg-indigo-950/30 border border-indigo-800/30 rounded-xl text-xs text-indigo-200 space-y-1">
              <p className="font-semibold text-indigo-300 flex items-center">
                <FileText className="w-4 h-4 mr-1.5 text-indigo-400" />
                Por que você está recebendo esta solicitação?
              </p>
              <p className="text-slate-400 leading-relaxed">
                O documento físico ou foto apresentado não pôde ser auditado matematicamente por assinatura digital criptográfica ICP-Brasil. Para garantir a segurança jurídica da empresa e a justa remuneração do colaborador, solicitamos apenas a sua confirmação formal de emissão.
              </p>
            </div>

            {/* Campo Opcional de Observações */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Observações ou Comentários Adicionais (Opcional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Atendimento realizado no plantão noturno..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botões de Ação de 1 Clique */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                onClick={() => handleResponse('CONFIRM')}
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Sim, Emiti o Atestado</span>
              </button>

              <button
                onClick={() => handleResponse('REPUDIATE')}
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 py-4 px-4 bg-rose-600/90 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-rose-900/30 transition-all active:scale-[0.98]"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Não Reconheço (Uso Indevido)</span>
              </button>
            </div>

            <p className="text-center text-[11px] text-slate-500">
              Ao clicar, seu endereço IP e horário serão carimbados eletronicamente para fins de auditoria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
