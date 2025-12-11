import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { AppearanceToggle } from './AppearanceToggle';
import { useTheme } from './ThemeProvider';

// Mock the useTheme hook
vi.mock('./ThemeProvider', () => ({
  useTheme: vi.fn(),
}));

describe('AppearanceToggle', () => {
  const setThemeMock = vi.fn();

  beforeEach(() => {
    (useTheme as Mock).mockReturnValue({ setTheme: setThemeMock });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the theme toggle button', () => {
    render(<AppearanceToggle />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });
});
