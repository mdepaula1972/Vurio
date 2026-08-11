/**
 * Vurio MVP Fase 1 — EntradaColumn
 * Coluna Entrada: campo de criação + lista de cards
 */
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Send, Inbox } from 'lucide-react';
import { Flow } from '../../engine/types';
import { FlowCard } from '../ui/FlowCard';

interface EntradaColumnProps {
  flows: Flow[];
  onAdd: (description: string) => void;
  onRemove: (id: string) => void;
}

export const EntradaColumn: React.FC<EntradaColumnProps> = ({
  flows,
  onAdd,
  onRemove,
}) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter ou Cmd+Enter para submeter; Enter sozinho quebra linha
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">

      {/* ── Header da coluna ─────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent-dim)] border border-[var(--border-hov)]
                          flex items-center justify-center">
            <Inbox className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-1)]">
            {t('entrada.title')}
          </h2>
          {flows.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent-dim)]
                             text-[var(--accent)] text-xs font-semibold
                             border border-[var(--accent-glow)]">
              {flows.length}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--text-3)] pl-9">
          {t('entrada.description')}
        </p>
      </div>

      {/* ── Campo de criação ─────────────────────────────────────── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)]
                      hover:border-[var(--border-hov)] focus-within:border-[var(--border-hov)]
                      rounded-2xl p-4 space-y-3 transition-all duration-200
                      focus-within:shadow-[0_0_24px_var(--accent-glow)]">

        <label className="text-xs font-semibold text-[var(--text-2)]">
          {t('entrada.question')}
        </label>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('entrada.placeholder')}
          rows={3}
          className="w-full bg-transparent text-sm text-[var(--text-1)]
                     placeholder:text-[var(--text-3)] resize-none
                     border-none outline-none leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1 border-t border-[var(--border)]">
          <span className="text-[11px] text-[var(--text-3)] hidden sm:block">
            Ctrl + Enter para adicionar
          </span>
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-xl
              bg-[var(--accent)] hover:bg-indigo-500
              disabled:opacity-30 disabled:cursor-not-allowed
              text-white text-xs font-semibold
              transition-all duration-200 active:scale-95
              shadow-[0_0_16px_var(--accent-glow)]
            "
          >
            <Plus className="w-3.5 h-3.5" />
            {t('entrada.addBtn')}
          </button>
        </div>
      </div>

      {/* ── Lista de fluxos ──────────────────────────────────────── */}
      <div className="flex-1 space-y-3">
        {flows.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                          min-h-[200px] border-2 border-dashed border-[var(--border)]
                          rounded-2xl text-center p-8 space-y-3 animate-fade-in">
            <Send className="w-8 h-8 text-[var(--text-3)]" />
            <p className="text-sm text-[var(--text-3)] max-w-xs leading-relaxed">
              {t('entrada.empty')}
            </p>
          </div>
        ) : (
          flows.map((flow, idx) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onRemove={onRemove}
              style={{ animationDelay: `${idx * 60}ms` }}
            />
          ))
        )}
      </div>

    </div>
  );
};
