/**
 * Vurio MVP Fase 1 — AppShell
 * Shell principal do aplicativo: header + menu + conteúdo
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Inbox, LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
import { LanguageSelector } from '../ui/LanguageSelector';
import { EntradaColumn } from './EntradaColumn';
import { useFlows } from '../../hooks/useFlows';

type NavTab = 'overview' | 'entrada' | 'settings';

interface AppShellProps {
  capacity: number;
  onCapacityChange?: (newCapacity: number) => void;
}

export const AppShell: React.FC<AppShellProps> = ({ capacity, onCapacityChange }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<NavTab>('entrada');
  const { flows, addFlow, removeFlow } = useFlows();

  const navItems: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
    { id: 'entrada',  label: t('nav.entrada'),  icon: Inbox },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-dvh bg-[var(--bg-base)] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)]
                         bg-[var(--bg-base)/90] backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo + nome */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img
              src="/logo.png"
              alt="Vurio"
              className="h-6 w-auto object-contain opacity-90"
            />
            <span className="font-bold text-sm tracking-wide text-[var(--text-1)]">
              VURIO
            </span>
          </div>

          {/* Capacidade discreta */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                          bg-[var(--bg-card)] border border-[var(--border)]
                          text-xs text-[var(--text-3)]">
            <Inbox className="w-3.5 h-3.5 text-[var(--accent)] opacity-70" />
            <span>{t('app.capacity', { count: capacity })}</span>
          </div>

          <LanguageSelector />
        </div>
      </header>

      {/* ── Nav Tabs ───────────────────────────────────────────────── */}
      <div className="sticky top-14 z-20 border-b border-[var(--border)]
                      bg-[var(--bg-base)/95] backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <nav className="flex" role="tablist">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium
                    transition-colors duration-150
                    ${isActive
                      ? 'text-[var(--text-1)]'
                      : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>

                  {/* Indicador ativo */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5
                                     bg-[var(--accent)] rounded-t-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Conteúdo ───────────────────────────────────────────────── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">

        {/* Visão Geral — placeholder */}
        {activeTab === 'overview' && (
          <div className="flex flex-col items-center justify-center min-h-[300px]
                          text-center space-y-4 animate-fade-in">
            <LayoutDashboard className="w-10 h-10 text-[var(--text-3)]" />
            <h2 className="text-lg font-semibold text-[var(--text-2)]">
              {t('overview.title')}
            </h2>
            <p className="text-sm text-[var(--text-3)]">
              {t('overview.soon')}
            </p>
          </div>
        )}

        {/* Entrada */}
        {activeTab === 'entrada' && (
          <div className="animate-fade-up">
            <EntradaColumn
              flows={flows}
              onAdd={addFlow}
              onRemove={removeFlow}
            />
          </div>
        )}

        {/* Configurações */}
        {activeTab === 'settings' && (
          <SettingsPanel
            capacity={capacity}
            onCapacityChange={onCapacityChange}
          />
        )}

      </main>
    </div>
  );
};

// ─── Painel de Configurações ─────────────────────────────────────────────────

interface SettingsPanelProps {
  capacity: number;
  onCapacityChange?: (v: number) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ capacity, onCapacityChange }) => {
  const { t } = useTranslation();
  const [localCapacity, setLocalCapacity] = useState(capacity);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onCapacityChange?.(localCapacity);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-md">
      <h2 className="text-lg font-semibold text-[var(--text-1)]">
        {t('settings.title')}
      </h2>

      {/* Capacidade */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-1)]">{t('settings.capacity')}</p>
          <p className="text-xs text-[var(--text-3)] mt-0.5">{t('settings.capacityDesc')}</p>
        </div>
        <input
          type="number"
          min={1}
          max={50}
          value={localCapacity}
          onChange={e => {
            const v = parseInt(e.target.value, 10);
            if (!isNaN(v)) setLocalCapacity(Math.min(50, Math.max(1, v)));
          }}
          className="w-28 bg-[var(--bg-base)] border border-[var(--border)]
                     hover:border-[var(--border-hov)] focus:border-[var(--border-hov)]
                     rounded-xl px-4 py-2.5 text-center text-xl font-bold text-[var(--text-1)]
                     outline-none transition-colors
                     [appearance:textfield]
                     [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      <button
        onClick={handleSave}
        className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-indigo-500
                   text-white text-sm font-semibold transition-all duration-200
                   active:scale-95 shadow-[0_0_16px_var(--accent-glow)]"
      >
        {saved ? '✓ Salvo!' : t('settings.save')}
      </button>
    </div>
  );
};
