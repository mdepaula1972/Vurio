/**
 * Vurio MVP Fase 1 — LandingPage
 * Tela inicial com logo, slogan e seletor de idioma
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { LanguageSelector } from '../ui/LanguageSelector';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-dvh flex flex-col bg-[var(--bg-base)] overflow-hidden">

      {/* ── Ambient glows de fundo ─────────────────────────────────── */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3
                   w-[700px] h-[700px] rounded-full
                   bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)]
                   pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3
                   w-[500px] h-[500px] rounded-full
                   bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.05)_0%,transparent_70%)]
                   pointer-events-none"
      />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Vurio"
            className="h-7 w-auto object-contain opacity-90"
          />
          <span className="font-bold text-sm tracking-wide text-[var(--text-1)] hidden sm:block">
            VURIO
          </span>
        </div>
        <LanguageSelector />
      </header>

      {/* ── Hero central ───────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 sm:px-10">
        <div className="max-w-2xl w-full text-center space-y-10">

          {/* Logo grande */}
          <div className="flex justify-center animate-fade-up">
            <div className="relative">
              {/* Glow pulsante atrás do logo */}
              <div
                aria-hidden
                className="absolute inset-0 -m-6 rounded-3xl
                           bg-[var(--accent-glow)] blur-2xl
                           animate-pulse-glow pointer-events-none"
              />
              <div className="relative bg-[var(--bg-surface)] border border-[var(--border)]
                              rounded-3xl p-6 sm:p-8 shadow-2xl">
                <img
                  src="/logo.png"
                  alt="Vurio"
                  className="h-16 sm:h-24 w-auto object-contain mx-auto
                             drop-shadow-[0_8px_32px_rgba(99,102,241,0.35)]"
                />
              </div>
            </div>
          </div>

          {/* Tagline + subtítulo */}
          <div className="space-y-4 animate-fade-up delay-100">
            <h1 className="text-3xl sm:text-5xl font-bold text-[var(--text-1)] leading-tight tracking-tight">
              {t('landing.tagline')}
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-2)] max-w-md mx-auto leading-relaxed">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* CTA */}
          <div className="animate-fade-up delay-200">
            <button
              onClick={onStart}
              className="
                inline-flex items-center gap-3 px-8 py-4 rounded-2xl
                bg-[var(--accent)] hover:bg-indigo-500
                text-white font-semibold text-base
                shadow-[0_0_32px_var(--accent-glow)]
                hover:shadow-[0_0_48px_var(--accent-glow)]
                transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95
              "
            >
              {t('landing.cta')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </main>

      {/* ── Footer discreto ────────────────────────────────────────── */}
      <footer className="relative z-10 text-center pb-6 animate-fade-in delay-400">
        <p className="text-xs text-[var(--text-3)]">
          Vurio · MVP Fase 1
        </p>
      </footer>

    </div>
  );
};
