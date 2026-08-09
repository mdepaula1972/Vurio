/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * BottomNav — Navegação inferior para dispositivos móveis (Mobile First)
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Home, GitFork, Mic, BarChart3, Users } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'processes' | 'voice' | 'analytics' | 'partners';
  onTabChange: (tab: 'home' | 'processes' | 'voice' | 'analytics' | 'partners') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  interface NavItem {
    id: 'home' | 'processes' | 'voice' | 'analytics' | 'partners';
    label: string;
    icon: React.ElementType;
    highlight?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'home', label: t('nav.home'), icon: Home },
    { id: 'processes', label: t('nav.processes'), icon: GitFork },
    { id: 'voice', label: 'IA & Voz', icon: Mic, highlight: true },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'partners', label: t('nav.partners'), icon: Users }
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-2">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="flex flex-col items-center justify-center -mt-6"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 text-white ring-4 ring-slate-950 transform active:scale-90 transition-transform">
                  <Mic className="w-6 h-6 animate-pulse" />
                </div>
                <span className="text-[10px] font-medium text-indigo-400 mt-1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
