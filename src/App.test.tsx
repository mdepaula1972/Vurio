import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App, { APP_VERSION } from './App';
import './i18n/config';

describe('App Integration & localStorage Initialization', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exports correct APP_VERSION constant', () => {
    expect(APP_VERSION).toBe('2.0.0');
  });

  it('initializes to LandingPage when localStorage has no user config', () => {
    render(<App />);

    // Landing page tagline and start button should be visible
    expect(screen.getByText(/Faça seus fluxos avançarem/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Começar/i })).toBeInTheDocument();
  });

  it('initializes to LandingPage when localStorage user config has onboardingDone = false', () => {
    localStorage.setItem(
      'vurio:user_config',
      JSON.stringify({ onboardingDone: false, capacity: 5 })
    );

    render(<App />);

    expect(screen.getByText(/Faça seus fluxos avançarem/i)).toBeInTheDocument();
  });

  it('initializes directly to AppShell when localStorage has onboardingDone = true', () => {
    localStorage.setItem(
      'vurio:user_config',
      JSON.stringify({ onboardingDone: true, capacity: 10 })
    );

    render(<App />);

    // AppShell tab should be rendered and capacity should reflect stored config
    expect(screen.getByRole('tab', { name: /Entrada/i })).toBeInTheDocument();
    expect(screen.queryByText(/Faça seus fluxos avançarem/i)).not.toBeInTheDocument();
  });

  it('handles corrupted localStorage JSON gracefully by falling back to LandingPage', () => {
    localStorage.setItem('vurio:user_config', 'invalid-json-content');

    render(<App />);

    expect(screen.getByText(/Faça seus fluxos avançarem/i)).toBeInTheDocument();
  });

  it('completes user onboarding flow from LandingPage -> CapacitySetup -> AppShell and updates localStorage', () => {
    render(<App />);

    // 1. On LandingPage, click "Começar"
    const startButton = screen.getByRole('button', { name: /Começar/i });
    fireEvent.click(startButton);

    // 2. Onboarding CapacitySetup screen should be displayed
    expect(screen.getByText(/Sua capacidade de fluxos/i)).toBeInTheDocument();
    const capacityInput = screen.getByLabelText(/Número de fluxos/i) as HTMLInputElement;
    expect(capacityInput.value).toBe('5');

    // Increase capacity using the increase button
    const increaseBtn = screen.getByRole('button', { name: /Aumentar/i });
    fireEvent.click(increaseBtn);
    expect(capacityInput.value).toBe('6');

    // Click "Continuar" to finish onboarding
    const continueBtn = screen.getByRole('button', { name: /Continuar/i });
    fireEvent.click(continueBtn);

    // 3. AppShell screen should now be visible
    expect(screen.getByRole('tab', { name: /Entrada/i })).toBeInTheDocument();

    // 4. Verify localStorage was updated correctly
    const storedConfigRaw = localStorage.getItem('vurio:user_config');
    expect(storedConfigRaw).not.toBeNull();
    const storedConfig = JSON.parse(storedConfigRaw!);
    expect(storedConfig.onboardingDone).toBe(true);
    expect(storedConfig.capacity).toBe(6);
  });
});
