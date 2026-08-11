/**
 * Vurio MVP Fase 1 — CapacitySetup
 * Onboarding: definição da capacidade de fluxos simultâneos
 */
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Minus, Plus, Layers } from 'lucide-react';

interface CapacitySetupProps {
  onConfirm: (capacity: number) => void;
}

export const CapacitySetup: React.FC<CapacitySetupProps> = ({ onConfirm }) => {
  const { t } = useTranslation();
  const [capacity, setCapacity] = useState(5);

  const dec = () => setCapacity(prev => Math.max(1, prev - 1));
  const inc = () => setCapacity(prev => Math.min(50, prev + 1));

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center
                    bg-[var(--bg-base)] px-6 overflow-hidden">

      {/* Glow de fundo */}
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[600px] h-[600px] rounded-full pointer-events-none
                   bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.10)_0%,transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-md space-y-10">

        {/* Ícone */}
        <div className="flex justify-center animate-fade-up">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-dim)] border border-[var(--border-hov)]
                          flex items-center justify-center
                          shadow-[0_0_32px_var(--accent-glow)]">
            <Layers className="w-8 h-8 text-[var(--accent)]" />
          </div>
        </div>

        {/* Textos */}
        <div className="text-center space-y-3 animate-fade-up delay-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-1)] tracking-tight">
            {t('onboarding.title')}
          </h1>
          <p className="text-[var(--text-2)] text-sm sm:text-base leading-relaxed">
            {t('onboarding.explanation')}
          </p>
        </div>

        {/* Seletor numérico */}
        <div className="animate-fade-up delay-200 space-y-5">
          <p className="text-center text-sm font-medium text-[var(--text-2)]">
            {t('onboarding.question')}
          </p>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={dec}
              disabled={capacity <= 1}
              aria-label="Diminuir"
              className="w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]
                         hover:border-[var(--border-hov)] hover:bg-[var(--bg-card-hov)]
                         disabled:opacity-30 disabled:cursor-not-allowed
                         flex items-center justify-center text-[var(--text-2)]
                         transition-all duration-200 active:scale-90"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Número em destaque */}
            <div className="relative">
              <div className="absolute inset-0 -m-2 rounded-2xl bg-[var(--accent-glow)] blur-xl pointer-events-none" />
              <div className="relative w-24 h-24 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-hov)]
                              flex items-center justify-center
                              shadow-[0_0_24px_var(--accent-glow)]">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={capacity}
                  onChange={e => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) setCapacity(Math.min(50, Math.max(1, v)));
                  }}
                  className="w-full text-center text-4xl font-bold text-[var(--text-1)]
                             bg-transparent border-none outline-none
                             [appearance:textfield]
                             [&::-webkit-outer-spin-button]:appearance-none
                             [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Número de fluxos"
                />
              </div>
            </div>

            <button
              onClick={inc}
              disabled={capacity >= 50}
              aria-label="Aumentar"
              className="w-12 h-12 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]
                         hover:border-[var(--border-hov)] hover:bg-[var(--bg-card-hov)]
                         disabled:opacity-30 disabled:cursor-not-allowed
                         flex items-center justify-center text-[var(--text-2)]
                         transition-all duration-200 active:scale-90"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-xs text-[var(--text-3)]">
            {t('onboarding.note')}
          </p>
        </div>

        {/* CTA */}
        <div className="animate-fade-up delay-300 flex justify-center">
          <button
            onClick={() => onConfirm(capacity)}
            className="
              inline-flex items-center gap-3 px-8 py-4 rounded-2xl
              bg-[var(--accent)] hover:bg-indigo-500
              text-white font-semibold text-base
              shadow-[0_0_32px_var(--accent-glow)]
              hover:shadow-[0_0_48px_var(--accent-glow)]
              transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95
            "
          >
            {t('onboarding.cta')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
};
