/**
 * Vurio v1.1.0 — Gestor Inteligente de Processos com IA
 * Navbar — Barra de navegação superior
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Globe, Plus, Sparkles, Activity } from 'lucide-react';
import { APP_VERSION } from '../../App';


interface NavbarProps {
  activeProcessesCount: number;
  maxFreeProcesses: number;
  onNewProcessClick: () => void;
  currentLang: string;
  onLanguageChange: (lang: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeProcessesCount,
  maxFreeProcesses,
  onNewProcessClick,
  currentLang,
  onLanguageChange,
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Slogan */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-white">VURIO</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v{APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              {t('app.tagline')}
            </p>
          </div>
        </div>


        {/* Action Controls & i18n & Freemium */}
        <div className="flex items-center space-x-3">
          
          {/* Seletor de Idioma (i18n) */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors border border-slate-700">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="uppercase">{currentLang.split('-')[0]}</span>
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-slate-900 border border-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50 overflow-hidden">
              <button 
                onClick={() => onLanguageChange('pt-BR')} 
                className={`w-full px-3 py-2 text-left text-xs hover:bg-indigo-600/20 flex items-center justify-between ${currentLang === 'pt-BR' ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}
              >
                <span>Português</span> 🇧🇷
              </button>
              <button 
                onClick={() => onLanguageChange('en-US')} 
                className={`w-full px-3 py-2 text-left text-xs hover:bg-indigo-600/20 flex items-center justify-between ${currentLang === 'en-US' ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}
              >
                <span>English</span> 🇺🇸
              </button>
              <button 
                onClick={() => onLanguageChange('es-ES')} 
                className={`w-full px-3 py-2 text-left text-xs hover:bg-indigo-600/20 flex items-center justify-between ${currentLang === 'es-ES' ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}
              >
                <span>Español</span> 🇪🇸
              </button>
            </div>
          </div>

          {/* Badge de Plano Gratuito (Freemium) */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('nav.freePlan')}: {activeProcessesCount}/{maxFreeProcesses}</span>
          </div>

          {/* Botão Novo Processo */}
          <button
            onClick={onNewProcessClick}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/25 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('nav.newProcess')}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
