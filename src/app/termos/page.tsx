'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TermosPage() {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-[#02c1db]/30 selection:text-[#02c1db]">
      
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
            <span>Conformidade Legal & LGPD (Lei nº 13.709/2018)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Termos de Uso, Política de Privacidade e Não Custódia de Documentos
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

        {/* DESTAQUE PRINCIPAL: POLÍTICA DE ZERO RETENÇÃO */}
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-300 font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <span>Política de Processamento Efêmero (Zero Retenção de Arquivos)</span>
          </div>
          <p className="text-slate-200 leading-relaxed">
            O Vurio opera sob o princípio da <strong>estrita necessidade e minimização de dados da LGPD (Art. 6º, III)</strong>. 
            Não armazenamos cópias de atestados médicos em nossos servidores.
          </p>
          <ul className="space-y-2 text-xs text-slate-300 pt-1">
            <li>• <strong>Processamento em Memória Volátil:</strong> O atestado enviado (PDF ou foto) é processado apenas pelo tempo estritamente necessário para extrair as assinaturas, verificar integridade de metadados e consultar os registros públicos do CFM.</li>
            <li>• <strong>Expurgo Imediato:</strong> Assim que o relatório de alertas de triagem é gerado e entregue ao solicitante (via WhatsApp ou Painel Web), o arquivo original é <strong>definitivamente expurgado e destruído</strong> da memória de nossos servidores.</li>
            <li>• <strong>Entrega do Relatório Substitui a Custódia:</strong> A entrega do relatório de alertas ao empregador/solicitante exaure qualquer custódia documental pelo Vurio. A guarda documental legal perante a Justiça do Trabalho, INSS e eSocial compete exclusivamente à empresa contratante (Controladora).</li>
          </ul>
        </div>

        {/* SEÇÃO 1: DADOS COLETADOS */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            1. O Que Armazenamos (Logs Técnicos Criptográficos)
          </h3>
          <p>
            Para evitar que o mesmo atestado seja apresentado em duplicidade (prevenção de inconsistências e duplicidades autorizada pelo Art. 7º, IX e Art. 11, II da LGPD), armazenamos unicamente:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
            <li><strong>Hash SHA-256 do arquivo:</strong> Uma sequência matemática irreversível (resumo criptográfico) que funciona como identificador único do documento, sem guardar o conteúdo nem o arquivo original;</li>
            <li><strong>Dados Públicos do Médico:</strong> Nome público no CFM, CRM e Unidade da Federação;</li>
            <li><strong>Período de Afastamento:</strong> Quantidade de dias prescritos para verificação de regras de CCT e limites legais;</li>
            <li><strong>Carimbo de Tempo:</strong> Data e horário exatos em que a triagem automatizada foi solicitada.</li>
          </ul>
          <p className="text-xs text-amber-300/90 pt-1">
            ⚠️ <strong>Importante:</strong> Não armazenamos em banco de dados o diagnóstico clínico (CID) do paciente, resguardando integralmente o sigilo médico previsto na Resolução CFM nº 1.658/2002.
          </p>
        </div>

        {/* SEÇÃO 2: PAPÉIS SOB A LGPD */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-400" />
            2. Papéis sob a LGPD: Controlador x Operador
          </h3>
          <p>
            A empresa contratante figura como <strong>Controladora</strong> dos dados de seus colaboradores, sendo a única responsável pela base legal e legitimidade da recepção do atestado no âmbito do vínculo de emprego. O Vurio atua exclusivamente como <strong>Operador técnico</strong>, executando a triagem automatizada de metadados sob instrução técnica e descartando o arquivo original imediatamente após o processamento.
          </p>
        </div>

        {/* SEÇÃO 3: CARÁTER CONSULTIVO */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            3. Postura de Triagem Neutra e Não Punitiva
          </h3>
          <p>
            O Vurio não formula acusações de dolo, má-fé ou qualquer juízo condenatório. Os relatórios de triagem limitam-se a apontar conformidades técnicas ou indícios de divergência matemática e cadastral (ex.: ausência de cadeia ICP-Brasil válida, carimbo de tempo posterior ou CRM divergente). A análise e quaisquer medidas administrativas ou disciplinares competem exclusivamente aos profissionais humanos habilitados da empresa empregadora.
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
