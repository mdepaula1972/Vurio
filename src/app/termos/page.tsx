'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';

export default function TermosPage() {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-all px-2.5 py-1 rounded-lg hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para o Início</span>
          </Link>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white">VURIO</span>
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
            Vurio Compliance & Perícia Digital LTDA • Atualizado em Setembro de 2026
          </p>
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
            <li>• <strong>Processamento em Memória Volátil:</strong> O atestado enviado (PDF ou foto) é processado apenas pelo tempo estritamente necessário para extrair as assinaturas e consultar o CFM.</li>
            <li>• <strong>Expurgo Imediato:</strong> Assim que o laudo pericial é emitido e entregue ao solicitante (via WhatsApp ou Web), o arquivo original é <strong>definitivamente apagado e destruído</strong> de nossos servidores.</li>
            <li>• <strong>Entrega do Laudo Substitui a Custódia:</strong> A entrega do laudo pericial ao empregador/solicitante exaure qualquer obrigação de guarda pelo Vurio. A custódia documental legal perante a Justiça do Trabalho, INSS e eSocial compete exclusivamente à empresa contratante.</li>
          </ul>
        </div>

        {/* SEÇÃO 1: DADOS COLETADOS */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            1. O Que Armazenamos (Logs Técnicos Criptográficos)
          </h3>
          <p>
            Para evitar que o mesmo atestado seja apresentado em duplicidade (prevenção a fraudes autorizada pelo Art. 7º, IX e Art. 11, II da LGPD), armazenamos unicamente:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
            <li><strong>Hash SHA-256 do arquivo:</strong> Uma sequência matemática irreversível que funciona como a "impressão digital" do documento, sem guardar o arquivo em si;</li>
            <li><strong>Dados do Médico:</strong> Nome público no CFM, CRM e Estado;</li>
            <li><strong>Período de Afastamento:</strong> Quantidade de dias prescritos para aplicação de regras da CCT;</li>
            <li><strong>Carimbo de Tempo:</strong> Data e horário exatos em que a perícia foi solicitada.</li>
          </ul>
          <p className="text-xs text-amber-300/90 pt-1">
            ⚠️ <strong>Importante:</strong> Não salvamos em banco de dados o diagnóstico clínico (CID) do paciente, resguardando integralmente o sigilo médico.
          </p>
        </div>

        {/* SEÇÃO 2: PAPÉIS SOB A LGPD */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-400" />
            2. Papéis sob a LGPD: Controlador x Operador
          </h3>
          <p>
            A empresa contratante figura como <strong>Controladora</strong> dos dados de seus colaboradores, sendo a responsável pela legalidade da coleta do atestado no âmbito do contrato de trabalho. O Vurio atua exclusivamente como <strong>Operador técnico</strong>, executando a perícia e descartando o arquivo original imediatamente após a conclusão.
          </p>
        </div>

        {/* SEÇÃO 3: CARÁTER CONSULTIVO */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            3. Postura de Auditoria Independente
          </h3>
          <p>
            O Vurio não formula acusações de dolo ou crime. Os laudos técnicos limitam-se a apontar conformidades ou inconsistências matemáticas e cadastrais (ex: ausência de certificado ICP-Brasil ou divergência de dígitos no CPF). Quaisquer medidas disciplinares ou administrativas são de deliberação exclusiva da empresa empregadora.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <p>© 2026 Vurio Compliance & Perícia Digital LTDA. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
