/**
 * Vurio v1.0.0 — Gestor Inteligente de Processos com IA
 * Ponto de entrada principal da aplicação
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n/config';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
