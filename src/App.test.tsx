import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import App, { APP_VERSION } from './App';
import { getUserConfig, saveUserConfig } from './services/storage';

describe('App component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('exports the correct APP_VERSION constant', () => {
    expect(APP_VERSION).toBe('2.0.0');
  });

  it('renders landing page by default when user is not onboarded', () => {
    render(<App />);

    // Check LandingPage header logo text and CTA button
    expect(screen.getByText('VURIO')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /começar/i })).toBeInTheDocument();
  });

  it('renders app shell immediately if onboarding is already completed in localStorage', () => {
    saveUserConfig({ capacity: 8, language: 'pt-BR', onboardingDone: true });

    render(<App />);

    expect(screen.getByRole('tab', { name: /entrada/i })).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('8'))).toBeInTheDocument();
  });

  it('navigates through full onboarding flow: Landing -> Onboarding -> App', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. Landing Page: Click start button
    const startBtn = screen.getByRole('button', { name: /começar/i });
    await user.click(startBtn);

    // 2. Onboarding Page: Should display capacity setup
    expect(await screen.findByRole('button', { name: /aumentar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();

    // Increase capacity by clicking '+' button
    const plusBtn = screen.getByRole('button', { name: /aumentar/i });
    await user.click(plusBtn); // 5 -> 6

    // Confirm capacity
    const confirmBtn = screen.getByRole('button', { name: /continuar/i });
    await user.click(confirmBtn);

    // 3. App Shell: Should show main application
    expect(await screen.findByRole('tab', { name: /entrada/i })).toBeInTheDocument();

    // Verify localStorage was updated correctly
    const config = getUserConfig();
    expect(config.onboardingDone).toBe(true);
    expect(config.capacity).toBe(6);
  });

  it('allows changing capacity from Settings inside AppShell and updates storage', async () => {
    const user = userEvent.setup();
    saveUserConfig({ capacity: 5, language: 'pt-BR', onboardingDone: true });

    render(<App />);

    // Switch to Settings tab
    const settingsTab = screen.getByRole('tab', { name: /configurações/i });
    await user.click(settingsTab);

    // Find capacity input in Settings
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(5);

    // Update capacity value
    fireEvent.change(input, { target: { value: '12' } });

    // Click Save button
    const saveBtn = screen.getByRole('button', { name: /salvar/i });
    await user.click(saveBtn);

    expect(getUserConfig().capacity).toBe(12);
  });
});
