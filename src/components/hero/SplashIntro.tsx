import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, Workflow, ArrowRight, Mic, ShieldCheck, Scale } from 'lucide-react';

interface SplashIntroProps {
  onEnterApp: () => void;
  onOpenWizard: () => void;
  onOpenVoiceConsultant: () => void;
}

export const SplashIntro: React.FC<SplashIntroProps> = ({
  onEnterApp,
  onOpenWizard,
  onOpenVoiceConsultant
}) => {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/95 border border-indigo-500/30 p-8 sm:p-14 shadow-2xl shadow-indigo-950/60 mb-10 text-center">
      
      {/* Dynamic Background Neon Light Glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/30 via-violet-600/20 to-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        
        {/* LOGO DA JANELA PRINCIPAL COM EFEITO NEON GLOW */}
        <div className="flex flex-col items-center justify-center pt-2">
          <div className="relative group cursor-pointer" onClick={onEnterApp}>
            {/* Glowing Aura Ring */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-all duration-700 animate-tilt" />
            
            {/* Logo Frame */}
            <div className="relative bg-slate-950 border border-slate-700/80 hover:border-indigo-400 p-6 sm:p-8 rounded-3xl shadow-2xl transition-all duration-500 transform group-hover:scale-105">
              <img
                src="/logo.png"
                alt="VURIO Logo"
                className="h-20 sm:h-28 w-auto object-contain mx-auto drop-shadow-[0_10px_20px_rgba(99,102,241,0.4)]"
              />
            </div>
          </div>
        </div>

        {/* SLOGAN EM DESTAQUE E SUBTÍTULO */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-200 tracking-tight leading-tight">
            {t('app.tagline')}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
            {t('app.subtitle')}
          </p>
        </div>

        {/* RECURSOS EM DESTAQUE (CHIPS) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Vurio Pulse Flow
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Auditoria de IA & WIP Limit
          </div>

          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            Cálculo Ponderado (100%)
          </div>
        </div>

        {/* BOTÕES DE AÇÃO DE ENTRADA */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          
          {/* Botão Principal: Entrar no Vurio Pulse Flow */}
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:via-indigo-500 hover:to-emerald-500 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-indigo-600/40 hover:shadow-indigo-600/60 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>Entrar no Vurio Pulse Flow</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Botão Secundário: IA Consultiva & Voz */}
          <button
            onClick={onOpenVoiceConsultant}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>IA Consultiva & Voz</span>
          </button>

          {/* Botão Assistente Guiado */}
          <button
            onClick={onOpenWizard}
            className="w-full sm:w-auto px-5 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
          >
            <Workflow className="w-4 h-4 text-indigo-400" />
            <span>Assistente Guiado</span>
          </button>

        </div>

      </div>
    </div>
  );
};
