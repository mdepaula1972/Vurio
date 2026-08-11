/**
 * Vurio MVP Fase 1 — FlowCard
 * Card simples que representa um fluxo na coluna Entrada
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { Flow } from '../../engine/types';

interface FlowCardProps {
  flow: Flow;
  onRemove?: (id: string) => void;
  style?: React.CSSProperties;
}

function formatDate(isoString: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(isoString));
  } catch {
    return isoString.slice(0, 10);
  }
}

export const FlowCard: React.FC<FlowCardProps> = ({ flow, onRemove, style }) => {
  const { t, i18n } = useTranslation();

  return (
    <article
      style={style}
      className="
        group relative bg-[var(--bg-card)] border border-[var(--border)]
        hover:border-[var(--border-hov)] hover:bg-[var(--bg-card-hov)]
        rounded-2xl p-4 sm:p-5 transition-all duration-200
        shadow-sm hover:shadow-[0_0_24px_var(--accent-glow)]
        animate-fade-up
      "
    >
      {/* Glow sutil no hover */}
      <div className="
        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
        bg-gradient-to-br from-[var(--accent-dim)] to-transparent
        transition-opacity duration-300 pointer-events-none
      " />

      <div className="relative z-10 flex items-start justify-between gap-3">
        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0 space-y-3">
          <p className="text-[var(--text-1)] text-sm sm:text-base font-medium leading-snug">
            {flow.description}
          </p>

          {/* Metadados */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Badge status */}
            <span className="
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
              bg-[var(--accent-dim)] text-[var(--accent)] text-xs font-semibold
              border border-[var(--accent-glow)]
            ">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-80" />
              {t('entrada.statusLabel')} · #{flow.position}
            </span>

            {/* Data */}
            <span className="text-[var(--text-3)] text-xs">
              {formatDate(flow.createdAt, i18n.language)}
            </span>
          </div>
        </div>

        {/* Botão remover (aparece no hover) */}
        {onRemove && (
          <button
            onClick={() => onRemove(flow.id)}
            aria-label="Remover fluxo"
            className="
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              p-1.5 rounded-lg text-[var(--text-3)] hover:text-red-400
              hover:bg-red-400/10 flex-shrink-0 mt-0.5
            "
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  );
};
