/**
 * Vurio MVP Fase 1 — LanguageSelector
 * Seletor de idioma discreto para landing page e settings
 */
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { AppLanguage } from '../../engine/types';
import { updateUserConfig } from '../../services/storage';

const LANGUAGES: { code: AppLanguage; label: string; flag: string }[] = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'en-US', label: 'English',   flag: '🇺🇸' },
  { code: 'es-ES', label: 'Español',   flag: '🇪🇸' },
];

interface LanguageSelectorProps {
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleSelect = (lang: AppLanguage) => {
    i18n.changeLanguage(lang);
    updateUserConfig({ language: lang });
    setOpen(false);
  };

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hov)] transition-all duration-200"
        aria-label="Selecionar idioma"
      >
        <Globe className="w-4 h-4 opacity-70" />
        <span>{current.flag}</span>
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-50 animate-scale-in">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[var(--bg-card-hov)] transition-colors"
            >
              <span className="flex items-center gap-2.5 text-[var(--text-1)]">
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </span>
              {lang.code === i18n.language && (
                <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
