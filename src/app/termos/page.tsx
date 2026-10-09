import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { LEAD_RETENTION_DAYS } from '@/lib/services/lead-service';

export default function TermosPage() {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-[#02c1db]/30 selection:text-[#02c1db] bg-[#040c18]">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/60 bg-[#040c18]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-all px-2.5 py-1 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para o Início</span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#0077d1] via-[#02c1db] to-[#01cf9e] flex items-center justify-center">
              <img src="/logo.png" alt="Vurio" className="w-full h-full object-contain rounded-full bg-white" />
            </div>
            <span className="font-black text-base tracking-tight text-white">Vurio</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Jurídico */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
        
        <div className="space-y-2 border-b border-slate-800 pb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Diretrizes de Privacidade e Proteção de Dados (Lei nº 13.709/2018)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Termos de Uso, Política de Privacidade e Retenção de Dados
          </h1>
          <p className="text-slate-400 text-xs">
            Vurio Tecnologia & Triagem Digital LTDA • Atualizado em Outubro de 2026
          </p>
        </div>

        {/* AVISO LEGAL CRÍTICO */}
        <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 text-sky-200 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#02c1db] mt-0.5" />
          <div>
            <strong className="block text-white mb-0.5">Aviso Legal sobre a Natureza da Triagem:</strong>
            O Vurio sinaliza indícios técnicos e divergências para apoiar a análise do RH e Departamento Pessoal. A decisão final é sempre humana e não substitui parecer médico ou jurídico.
          </div>
        </div>

        {/* 1. PROCESSAMENTO DE ARQUIVOS DE ATESTADOS (RETENÇÃO REAL) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <span>1. Processamento Efêmero do Arquivo Original (Sem Armazenamento de Binários)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            O Vurio opera sob o princípio da estrita necessidade e minimização de dados da LGPD (Art. 6º, III):
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pl-2">
            <li>• <strong>Arquivo Original (PDF ou Foto):</strong> O documento recebido pelo WhatsApp é mantido exclusivamente em memória volátil durante a execução da análise criptográfica e cadastral. Concluída a validação e emitido o relatório para o DP, o arquivo original <strong>não é gravado em disco, servidores de arquivo ou bucket de storage</strong>.</li>
            <li>• <strong>Não Custódia Documental:</strong> A guarda legal do atestado perante o eSocial, Previdência e Justiça do Trabalho compete exclusivamente à empresa empregadora (Controladora).</li>
          </ul>
        </div>

        {/* 2. LOGS TÉCNICOS DE VALIDAÇÃO GRAVADOS */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            2. O Que Fica Gravado na Análise do Atestado (Logs Técnicos)
          </h3>
          <p>
            Após o processamento de um atestado médico enviado por colaborador de empresa contratante, são registrados em banco de dados exclusivamente os seguintes metadados técnicos de auditoria para visualização no Painel do DP e prevenção de duplicidades:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
            <li><strong>Hash SHA-256 do arquivo:</strong> Identificador matemático irreversível utilizado como trava técnica contra reapresentação do mesmo arquivo em períodos distintos;</li>
            <li><strong>Formato técnico do documento:</strong> Registro neutro exclusivamente da extensão do arquivo (ex.: pdf, jpg), sem armazenar a nomenclatura original;</li>
            <li><strong>Dados públicos do médico emissor:</strong> Nome completo, número do CRM e UF conferidos no CFM;</li>
            <li><strong>Parâmetros da assinatura digital:</strong> Emissor do certificado (ICP-Brasil), hash calculado e hash esperado da cadeia PAdES;</li>
            <li><strong>Período de repouso prescrito:</strong> Quantidade de dias e data de início do afastamento;</li>
            <li><strong>Resultado da triagem e carimbo de tempo:</strong> Status técnico apurado (autêntico, divergência detectada, etc.) e data/hora da emissão.</li>
          </ul>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <p className="text-emerald-400 font-semibold">
              ✓ Dados que NÃO são gravados na tabela de auditoria de validação:
            </p>
            <p className="text-slate-400">
              O sistema <strong>não grava</strong> o nome do colaborador/paciente, o telefone pessoal do colaborador nem o diagnóstico clínico (CID) na tabela de logs de validação, respeitando o sigilo médico (Resolução CFM nº 1.658/2002).
            </p>
          </div>
        </div>

        {/* 3. PRIVACIDADE DOS LEADS COMERCIAIS VIA WHATSAPP (EXIGÊNCIA ETAPA 3) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-sky-500/30 space-y-3">
          <div className="flex items-center space-x-2 text-[#02c1db] font-bold text-base">
            <MessageSquare className="w-5 h-5" />
            <span>3. Privacidade e Retenção de Contatos Comerciais (Leads via WhatsApp)</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Quem entrar em contato pelo WhatsApp tem o número e o texto da mensagem armazenados por até <strong>{LEAD_RETENTION_DAYS} dias</strong> para atendimento comercial. No entanto, responder 'sair' interrompe as mensagens automáticas e remove o conteúdo da sua mensagem; para pedir a exclusão total dos seus dados, escreva para o WhatsApp (13) 3150-0987 com a mensagem 'excluir meus dados'.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Após o período de até {LEAD_RETENTION_DAYS} dias, os registros de contatos comerciais inativos são removidos por rotina programada de limpeza de dados.
          </p>
        </div>

        {/* 4. PAPÉIS SOB A LGPD */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-400" />
            4. Papéis sob a LGPD: Controlador x Operador
          </h3>
          <p>
            A empresa contratante figura como <strong>Controladora</strong> dos dados de seus colaboradores, sendo a responsável pela base legal do recebimento do atestado no âmbito das obrigações da relação de emprego (CLT e Lei 8.213/91). O Vurio atua como <strong>Operador técnico</strong> sob mandato, realizando a triagem automatizada e entregando o relatório de alertas ao Departamento Pessoal.
          </p>
        </div>

        {/* 5. CARÁTER CONSULTIVO */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            5. Postura de Triagem Técnica Neutra
          </h3>
          <p>
            O Vurio não formula juízos de valor nem acusações de dolo. A ferramenta sinaliza indícios objetivos de conformidade ou inconsistência documental para subsidiar a deliberação dos profissionais de RH e Medicina do Trabalho da empresa.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <p className="text-[11px] text-slate-400">
          O Vurio sinaliza indícios para apoiar a análise do RH. A decisão final é sempre humana e não substitui parecer médico ou jurídico.
        </p>
        <p>© 2026 Vurio Tecnologia & Triagem Digital LTDA. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
