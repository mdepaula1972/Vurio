/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * Configuração de internacionalização (i18n) — PT-BR, EN-US, ES-ES
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import LanguageDetector from 'i18next-browser-languagedetector';

import ptBR from '../../public/locales/pt-BR/translation.json';
import enUS from '../../public/locales/en-US/translation.json';
import esES from '../../public/locales/es-ES/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'pt-BR': { translation: ptBR },
      'en-US': { translation: enUS },
      'es-ES': { translation: esES }
    },
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en-US', 'es-ES'],
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
