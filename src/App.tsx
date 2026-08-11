/**
 * Vurio v2.0.0 — MVP Fase 1
 * App.tsx — Roteador principal: Landing → Onboarding → App
 *
 * O fluxo de telas é controlado por estado local + localStorage.
 * Os componentes legados do v1.3.0 estão mantidos na pasta src/
 * mas não são utilizados nesta fase.
 */
import React, { useState } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { CapacitySetup } from './components/onboarding/CapacitySetup';
import { AppShell } from './components/app/AppShell';
import { getUserConfig, updateUserConfig } from './services/storage';

type AppScreen = 'landing' | 'onboarding' | 'app';

function getInitialScreen(): AppScreen {
  const config = getUserConfig();
  if (config.onboardingDone) return 'app';
  return 'landing';
}

export const APP_VERSION = '2.0.0';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>(getInitialScreen);
  const [capacity, setCapacity] = useState(() => getUserConfig().capacity);

  const handleStart = () => {
    setScreen('onboarding');
  };

  const handleCapacityConfirm = (cap: number) => {
    setCapacity(cap);
    updateUserConfig({ capacity: cap, onboardingDone: true });
    setScreen('app');
  };

  const handleCapacityChange = (cap: number) => {
    setCapacity(cap);
    updateUserConfig({ capacity: cap });
  };

  if (screen === 'landing') {
    return <LandingPage onStart={handleStart} />;
  }

  if (screen === 'onboarding') {
    return <CapacitySetup onConfirm={handleCapacityConfirm} />;
  }

  return (
    <AppShell
      capacity={capacity}
      onCapacityChange={handleCapacityChange}
    />
  );
}
