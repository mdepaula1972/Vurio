import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { getUserConfig, saveUserConfig } from './services/storage';
import './i18n/config';

describe('App Component and handleCapacityConfirm', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders LandingPage initially when onboarding is not done', () => {
    render(<App />);
    const startButton = screen.getByRole('button', { name: /começar/i });
    expect(startButton).toBeInTheDocument();
  });

  it('transitions from LandingPage to CapacitySetup, then confirms capacity with handleCapacityConfirm', () => {
    render(<App />);

    // 1. Click start button on LandingPage to go to Onboarding
    const startButton = screen.getByRole('button', { name: /começar/i });
    fireEvent.click(startButton);

    // 2. CapacitySetup should now be rendered.
    // Verify increase capacity button and CTA button are present
    const increaseBtn = screen.getByRole('button', { name: /aumentar/i });
    expect(increaseBtn).toBeInTheDocument();

    // Increase capacity from default (5) to 6
    fireEvent.click(increaseBtn);

    // Click confirm button (CTA) in CapacitySetup -> triggers handleCapacityConfirm(6)
    const confirmBtn = screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(confirmBtn);

    // 3. Verify updateUserConfig was called and localStorage updated
    const config = getUserConfig();
    expect(config.onboardingDone).toBe(true);
    expect(config.capacity).toBe(6);

    // 4. Verify view transitioned to AppShell (which contains tab navigation for 'entrada', 'overview', 'settings')
    const navTab = screen.getByRole('tab', { selected: true });
    expect(navTab).toBeInTheDocument();
  });

  it('renders AppShell directly if onboarding is already done', () => {
    saveUserConfig({
      capacity: 10,
      language: 'pt-BR',
      onboardingDone: true,
    });

    render(<App />);

    // App shell nav tab list should be present
    const tabList = screen.getByRole('tablist');
    expect(tabList).toBeInTheDocument();

    // Verify current config
    const config = getUserConfig();
    expect(config.capacity).toBe(10);
    expect(config.onboardingDone).toBe(true);
  });

  it('handles capacity changes from AppShell settings', () => {
    saveUserConfig({
      capacity: 5,
      language: 'pt-BR',
      onboardingDone: true,
    });

    render(<App />);

    // Switch to Settings tab
    const tabs = screen.getAllByRole('tab');
    const settingsTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'false' && tab.textContent?.includes('Configurações'));
    if (settingsTab) {
      fireEvent.click(settingsTab);
    }

    // Find input for capacity in Settings
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '8' } });

    // Click save button in settings
    const saveButton = screen.getByRole('button', { name: /salvar/i });
    fireEvent.click(saveButton);

    // Verify localStorage updated with new capacity
    const updatedConfig = getUserConfig();
    expect(updatedConfig.capacity).toBe(8);
  });
});
